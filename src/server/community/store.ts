import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { emptySummary, summarizeRatings, type RecipeRating, type RatingSummary } from "./policy";

const DIR = path.join(process.cwd(), ".data", "ratings");

const ratingSchema = z.object({
  userId: z.string().min(1),
  taste: z.number().int().min(1).max(5),
  texture: z.number().int().min(1).max(5),
  wouldMakeAgain: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const fileSchema = z.object({
  slug: z.string().min(1),
  ratings: z.array(ratingSchema),
});

export class RatingError extends Error {
  constructor(
    public readonly code: "owner_cannot_rate" | "not_rateable" | "invalid_input",
    message: string,
  ) {
    super(message);
    this.name = "RatingError";
  }
}

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

function fileFor(slug: string) {
  return path.join(DIR, `${slug}.json`);
}

async function readFileRatings(slug: string): Promise<RecipeRating[]> {
  try {
    const raw = await readFile(fileFor(slug), "utf8");
    return fileSchema.parse(JSON.parse(raw)).ratings;
  } catch {
    return [];
  }
}

async function writeFileRatings(slug: string, ratings: RecipeRating[]) {
  await ensureDir();
  await writeFile(fileFor(slug), JSON.stringify({ slug, ratings }, null, 2), "utf8");
}

export async function listRatings(slug: string): Promise<RecipeRating[]> {
  return readFileRatings(slug);
}

export async function getRatingSummary(slug: string): Promise<RatingSummary> {
  return summarizeRatings(slug, await readFileRatings(slug));
}

export async function getRatingSummaries(slugs: string[]): Promise<Record<string, RatingSummary>> {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await getRatingSummary(slug)] as const),
  );
  return Object.fromEntries(entries);
}

export async function getUserRating(slug: string, userId: string): Promise<RecipeRating | null> {
  const ratings = await readFileRatings(slug);
  return ratings.find((rating) => rating.userId === userId) ?? null;
}

export async function upsertRating(input: {
  slug: string;
  userId: string;
  ownerId?: string | null;
  visibility: "public" | "unlisted" | "private";
  taste: number;
  texture: number;
  wouldMakeAgain: boolean;
}): Promise<{ rating: RecipeRating; summary: RatingSummary }> {
  if (input.visibility === "private") {
    throw new RatingError("not_rateable", "Private recipes are not part of the community shelf.");
  }
  if (input.ownerId && input.ownerId === input.userId) {
    throw new RatingError(
      "owner_cannot_rate",
      "Community Tested comes from other kitchens. You already published this one.",
    );
  }

  const parsed = ratingSchema.pick({ taste: true, texture: true, wouldMakeAgain: true }).safeParse({
    taste: input.taste,
    texture: input.texture,
    wouldMakeAgain: input.wouldMakeAgain,
  });
  if (!parsed.success) {
    throw new RatingError("invalid_input", "Rate taste and texture from 1 to 5, then say if you would make it again.");
  }

  const now = new Date().toISOString();
  const ratings = await readFileRatings(input.slug);
  const existing = ratings.find((rating) => rating.userId === input.userId);
  const rating: RecipeRating = {
    userId: input.userId,
    taste: parsed.data.taste,
    texture: parsed.data.texture,
    wouldMakeAgain: parsed.data.wouldMakeAgain,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = existing
    ? ratings.map((item) => (item.userId === input.userId ? rating : item))
    : [...ratings, rating];
  await writeFileRatings(input.slug, next);
  return { rating, summary: summarizeRatings(input.slug, next) };
}

export { emptySummary };

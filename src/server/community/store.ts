import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getUserById } from "@/server/accounts/users";
import {
  cleanComment,
  emptySummary,
  summarizeRatings,
  type PublicReview,
  type RecipeRating,
  type RatingSummary,
} from "./policy";

const DIR = path.join(process.cwd(), ".data", "ratings");

const score = z.number().int().min(1).max(5);

const ratingSchema = z.object({
  userId: z.string().min(1),
  taste: score,
  texture: score,
  similarity: score.nullable().default(null),
  ease: score.nullable().default(null),
  wouldMakeAgain: z.boolean(),
  comment: z.string().max(600).nullable().default(null),
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

function cookDisplayName(name: string | undefined) {
  const first = name?.trim().split(/\s+/)[0];
  return first || "A cook";
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

export async function listPublicReviews(slug: string): Promise<PublicReview[]> {
  const ratings = await readFileRatings(slug);
  const withComments = ratings.filter((rating) => rating.comment);
  const reviews = await Promise.all(
    withComments.map(async (rating) => {
      const user = await getUserById(rating.userId);
      return {
        userId: rating.userId,
        cookName: cookDisplayName(user?.name),
        taste: rating.taste,
        texture: rating.texture,
        similarity: rating.similarity,
        ease: rating.ease,
        wouldMakeAgain: rating.wouldMakeAgain,
        comment: rating.comment!,
        updatedAt: rating.updatedAt,
      };
    }),
  );
  return reviews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertRating(input: {
  slug: string;
  userId: string;
  ownerId?: string | null;
  visibility: "public" | "unlisted" | "private";
  taste: number;
  texture: number;
  similarity: number;
  ease: number;
  wouldMakeAgain: boolean;
  comment?: string | null;
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

  const parsed = z
    .object({
      taste: score,
      texture: score,
      similarity: score,
      ease: score,
      wouldMakeAgain: z.boolean(),
    })
    .safeParse({
      taste: input.taste,
      texture: input.texture,
      similarity: input.similarity,
      ease: input.ease,
      wouldMakeAgain: input.wouldMakeAgain,
    });
  if (!parsed.success) {
    throw new RatingError(
      "invalid_input",
      "Rate taste, texture, similarity, and ease from 1 to 5, then say if you would make it again.",
    );
  }

  const now = new Date().toISOString();
  const ratings = await readFileRatings(input.slug);
  const existing = ratings.find((rating) => rating.userId === input.userId);
  const rating: RecipeRating = {
    userId: input.userId,
    taste: parsed.data.taste,
    texture: parsed.data.texture,
    similarity: parsed.data.similarity,
    ease: parsed.data.ease,
    wouldMakeAgain: parsed.data.wouldMakeAgain,
    comment: cleanComment(input.comment),
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

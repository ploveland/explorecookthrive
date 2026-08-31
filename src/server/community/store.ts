import { z } from "zod";
import { getUserById } from "@/server/accounts/users";
import { dataDir, InvalidStorageIdError, parsePublicSlug, sha256Hex, readConfinedJson, writeConfinedJson } from "../fs/safe-path";
import { COMMENT_REJECTED_MESSAGE, moderateComment } from "./moderate";
import { canWriteRating, recordRatingWrite } from "./rate-limit";
import {
  emptySummary,
  summarizeRatings,
  type PublicReview,
  type RecipeRating,
  type RatingSummary,
} from "./policy";

const DIR = dataDir("ratings");

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
    public readonly code:
      | "owner_cannot_rate"
      | "not_rateable"
      | "invalid_input"
      | "blocked_comment"
      | "rate_limited",
    message: string,
  ) {
    super(message);
    this.name = "RatingError";
  }
}

function ratingFileId(slug: string) {
  return sha256Hex(`rating:${parsePublicSlug(slug)}`);
}

async function readFileRatings(slug: string): Promise<RecipeRating[]> {
  const id = ratingFileId(slug);
  try {
    const raw = await readConfinedJson(DIR, id, "hex64");
    return fileSchema.parse(JSON.parse(raw)).ratings;
  } catch (error) {
    if (error instanceof InvalidStorageIdError) throw error;
    return [];
  }
}

async function writeFileRatings(slug: string, ratings: RecipeRating[]) {
  const safe = parsePublicSlug(slug);
  await writeConfinedJson(DIR, ratingFileId(safe), JSON.stringify({ slug: safe, ratings }, null, 2), "hex64");
}

function cookDisplayName(name: string | undefined) {
  const first = name?.trim().split(/\s+/)[0];
  return first || "A cook";
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
  const reviews = await Promise.all(
    ratings.map(async (rating) => {
      const moderated = moderateComment(rating.comment);
      if (!moderated.ok || !moderated.comment) return null;
      const user = await getUserById(rating.userId);
      return {
        userId: rating.userId,
        cookName: cookDisplayName(user?.name),
        taste: rating.taste,
        texture: rating.texture,
        similarity: rating.similarity,
        ease: rating.ease,
        wouldMakeAgain: rating.wouldMakeAgain,
        comment: moderated.comment,
        updatedAt: rating.updatedAt,
      };
    }),
  );
  return reviews
    .filter((review): review is PublicReview => review !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
  if (input.visibility !== "public") {
    throw new RatingError("not_rateable", "Only public Thrive Versions can be rated by other kitchens.");
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

  const moderated = moderateComment(input.comment);
  if (!moderated.ok) {
    throw new RatingError("blocked_comment", COMMENT_REJECTED_MESSAGE);
  }

  if (!(await canWriteRating(input.userId))) {
    throw new RatingError(
      "rate_limited",
      "That is enough ratings for now. Come back later if you cooked another Thrive Version.",
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
    comment: moderated.comment,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = existing
    ? ratings.map((item) => (item.userId === input.userId ? rating : item))
    : [...ratings, rating];
  await writeFileRatings(input.slug, next);
  await recordRatingWrite(input.userId);
  return { rating, summary: summarizeRatings(input.slug, next) };
}

export { emptySummary };

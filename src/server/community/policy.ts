export const COMMUNITY_TESTED_MIN_RATINGS = 3;
export const COMMUNITY_TESTED_MIN_AVERAGE = 4;
export const COMMUNITY_TESTED_MIN_AGAIN_RATIO = 2 / 3;
export const COMMENT_MAX_LENGTH = 600;

export type RatingInput = {
  taste: number;
  texture: number;
  similarity: number;
  ease: number;
  wouldMakeAgain: boolean;
  comment: string | null;
};

export type RecipeRating = {
  userId: string;
  taste: number;
  texture: number;
  similarity: number | null;
  ease: number | null;
  wouldMakeAgain: boolean;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RatingSummary = {
  slug: string;
  count: number;
  tasteAverage: number | null;
  textureAverage: number | null;
  similarityAverage: number | null;
  easeAverage: number | null;
  overallAverage: number | null;
  wouldMakeAgainCount: number;
  wouldMakeAgainRatio: number | null;
  reviewCount: number;
  communityTested: boolean;
};

export type PublicReview = {
  userId: string;
  cookName: string;
  taste: number;
  texture: number;
  similarity: number | null;
  ease: number | null;
  wouldMakeAgain: boolean;
  comment: string;
  updatedAt: string;
};

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function present(values: Array<number | null | undefined>): number[] {
  return values.filter((value): value is number => typeof value === "number");
}

export function isCommunityTested(input: {
  count: number;
  tasteAverage: number | null;
  textureAverage: number | null;
  wouldMakeAgainRatio: number | null;
}) {
  return (
    input.count >= COMMUNITY_TESTED_MIN_RATINGS &&
    (input.tasteAverage ?? 0) >= COMMUNITY_TESTED_MIN_AVERAGE &&
    (input.textureAverage ?? 0) >= COMMUNITY_TESTED_MIN_AVERAGE &&
    (input.wouldMakeAgainRatio ?? 0) >= COMMUNITY_TESTED_MIN_AGAIN_RATIO
  );
}

export function summarizeRatings(slug: string, ratings: RecipeRating[]): RatingSummary {
  const tasteAverage = average(ratings.map((rating) => rating.taste));
  const textureAverage = average(ratings.map((rating) => rating.texture));
  const similarityAverage = average(present(ratings.map((rating) => rating.similarity)));
  const easeAverage = average(present(ratings.map((rating) => rating.ease)));
  const wouldMakeAgainCount = ratings.filter((rating) => rating.wouldMakeAgain).length;
  const wouldMakeAgainRatio = ratings.length === 0 ? null : wouldMakeAgainCount / ratings.length;
  const overallAverage = average(
    present([tasteAverage, textureAverage, similarityAverage, easeAverage]),
  );

  const summary = {
    slug,
    count: ratings.length,
    tasteAverage,
    textureAverage,
    similarityAverage,
    easeAverage,
    overallAverage,
    wouldMakeAgainCount,
    wouldMakeAgainRatio,
    reviewCount: ratings.filter((rating) => rating.comment).length,
    communityTested: false,
  };

  return {
    ...summary,
    communityTested: isCommunityTested(summary),
  };
}

export function emptySummary(slug: string): RatingSummary {
  return summarizeRatings(slug, []);
}

export function cleanComment(raw: string | null | undefined): string | null {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.slice(0, COMMENT_MAX_LENGTH);
}

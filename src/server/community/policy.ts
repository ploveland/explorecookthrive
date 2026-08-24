export const COMMUNITY_TESTED_MIN_RATINGS = 3;
export const COMMUNITY_TESTED_MIN_AVERAGE = 4;
export const COMMUNITY_TESTED_MIN_AGAIN_RATIO = 2 / 3;

export type RatingInput = {
  taste: number;
  texture: number;
  wouldMakeAgain: boolean;
};

export type RecipeRating = RatingInput & {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type RatingSummary = {
  slug: string;
  count: number;
  tasteAverage: number | null;
  textureAverage: number | null;
  overallAverage: number | null;
  wouldMakeAgainCount: number;
  wouldMakeAgainRatio: number | null;
  communityTested: boolean;
};

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
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
  const wouldMakeAgainCount = ratings.filter((rating) => rating.wouldMakeAgain).length;
  const wouldMakeAgainRatio = ratings.length === 0 ? null : wouldMakeAgainCount / ratings.length;
  const overallAverage =
    tasteAverage == null || textureAverage == null
      ? null
      : Math.round(((tasteAverage + textureAverage) / 2) * 10) / 10;

  const summary = {
    slug,
    count: ratings.length,
    tasteAverage,
    textureAverage,
    overallAverage,
    wouldMakeAgainCount,
    wouldMakeAgainRatio,
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

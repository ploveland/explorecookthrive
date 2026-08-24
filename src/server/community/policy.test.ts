import { describe, expect, it } from "vitest";
import {
  COMMUNITY_TESTED_MIN_RATINGS,
  isCommunityTested,
  summarizeRatings,
  type RecipeRating,
} from "./policy";

function rating(partial: Partial<RecipeRating> & Pick<RecipeRating, "userId" | "taste" | "texture">): RecipeRating {
  return {
    wouldMakeAgain: true,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    ...partial,
  };
}

describe("community tested policy", () => {
  it("does not badge a recipe with too few cooks", () => {
    const summary = summarizeRatings("chili", [
      rating({ userId: "a", taste: 5, texture: 5 }),
      rating({ userId: "b", taste: 5, texture: 5 }),
    ]);
    expect(summary.count).toBeLessThan(COMMUNITY_TESTED_MIN_RATINGS);
    expect(summary.communityTested).toBe(false);
  });

  it("badges when three kitchens score taste and texture at 4+ and would make it again", () => {
    const summary = summarizeRatings("chili", [
      rating({ userId: "a", taste: 4, texture: 5 }),
      rating({ userId: "b", taste: 5, texture: 4 }),
      rating({ userId: "c", taste: 4, texture: 4 }),
    ]);
    expect(summary.communityTested).toBe(true);
    expect(summary.tasteAverage).toBe(4.3);
    expect(summary.textureAverage).toBe(4.3);
  });

  it("withholds the badge when texture fails or cooks would not repeat it", () => {
    expect(
      isCommunityTested({
        count: 3,
        tasteAverage: 4.5,
        textureAverage: 3.2,
        wouldMakeAgainRatio: 1,
      }),
    ).toBe(false);
    expect(
      isCommunityTested({
        count: 3,
        tasteAverage: 4.5,
        textureAverage: 4.5,
        wouldMakeAgainRatio: 0.3,
      }),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  COMMUNITY_TESTED_MIN_RATINGS,
  cleanComment,
  isCommunityTested,
  summarizeRatings,
  type RecipeRating,
} from "./policy";

function rating(
  partial: Partial<RecipeRating> & Pick<RecipeRating, "userId" | "taste" | "texture">,
): RecipeRating {
  return {
    similarity: 4,
    ease: 4,
    wouldMakeAgain: true,
    comment: null,
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

  it("averages similarity and ease when present and ignores missing older scores", () => {
    const summary = summarizeRatings("chili", [
      rating({ userId: "a", taste: 4, texture: 4, similarity: 5, ease: 3 }),
      rating({ userId: "b", taste: 4, texture: 4, similarity: null, ease: null }),
    ]);
    expect(summary.similarityAverage).toBe(5);
    expect(summary.easeAverage).toBe(3);
    expect(summary.reviewCount).toBe(0);
  });

  it("counts optional cook notes as reviews", () => {
    const summary = summarizeRatings("chili", [
      rating({ userId: "a", taste: 5, texture: 5, comment: "Still tasted like chili." }),
    ]);
    expect(summary.reviewCount).toBe(1);
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

  it("trims cook notes and drops empty ones", () => {
    expect(cleanComment("  Still chili.  ")).toBe("Still chili.");
    expect(cleanComment("   ")).toBeNull();
  });
});

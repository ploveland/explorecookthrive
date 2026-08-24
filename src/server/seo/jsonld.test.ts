import { describe, expect, it } from "vitest";
import type { PublishedRecipe } from "../library/schema";
import { recipeJsonLd, shouldIndexRecipe } from "./jsonld";

const recipe = {
  slug: "weeknight-chili-thrived",
  title: "Weeknight chili, thrived",
  description: "A pot that still tastes like chili.",
  originalTitle: "Weeknight chili",
  sourceUrl: "https://example.com/chili",
  servings: 6,
  prepMinutes: 15,
  cookMinutes: 40,
  visibility: "public",
  ingredients: [{ rawText: "1 pound ground beef" }],
  instructions: ["Brown the beef."],
  nutrition: null,
} as unknown as PublishedRecipe;

describe("recipe SEO", () => {
  it("indexes only public recipes", () => {
    expect(shouldIndexRecipe({ visibility: "public" })).toBe(true);
    expect(shouldIndexRecipe({ visibility: "unlisted" })).toBe(false);
    expect(shouldIndexRecipe({ visibility: "private" })).toBe(false);
  });

  it("builds Recipe JSON-LD without inventing nutrition", () => {
    const json = recipeJsonLd(recipe);
    expect(json["@type"]).toBe("Recipe");
    expect(json.recipeIngredient).toEqual(["1 pound ground beef"]);
    expect(json.nutrition).toBeUndefined();
    expect(json.isBasedOn).toBe("https://example.com/chili");
  });

  it("passes through USDA per-serving numbers when present", () => {
    const withNutrition = {
      ...recipe,
      nutrition: {
        thrive: {
          perServing: {
            calories: 410,
            proteinG: 28,
            fiberG: 9,
            fatG: 12,
            saturatedFatG: 3,
            carbsG: 40,
            sugarG: 6,
            sodiumMg: 620,
          },
        },
      },
    } as unknown as PublishedRecipe;
    const json = recipeJsonLd(withNutrition);
    expect(json.nutrition).toMatchObject({
      "@type": "NutritionInformation",
      calories: "410 calories",
      sodiumContent: "620 mg",
    });
  });

  it("adds aggregateRating from cook scores without inventing them", () => {
    const json = recipeJsonLd(recipe, {
      slug: recipe.slug,
      count: 3,
      tasteAverage: 4.3,
      textureAverage: 4.3,
      overallAverage: 4.3,
      wouldMakeAgainCount: 3,
      wouldMakeAgainRatio: 1,
      communityTested: true,
    });
    expect(json.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: "4.3",
      ratingCount: 3,
    });
    expect(recipeJsonLd(recipe).aggregateRating).toBeUndefined();
  });
});

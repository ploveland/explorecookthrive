import { describe, expect, it } from "vitest";
import type { PublishedRecipe } from "../library/schema";
import {
  auditGoogleRecipe,
  libraryItemListJsonLd,
  recipeJsonLd,
  shouldIndexRecipe,
} from "./jsonld";

const recipe = {
  slug: "weeknight-chili-thrived",
  title: "Weeknight chili, thrived",
  description: "A pot that still tastes like chili.",
  originalTitle: "Weeknight chili",
  sourceUrl: "https://example.com/chili",
  sourceAuthor: "Pat",
  servings: 6,
  prepMinutes: 15,
  cookMinutes: 40,
  cuisine: "American",
  category: "dinner",
  tags: ["dinner", "american", "weeknight", "comfort-food", "higher-protein"],
  dietary: ["gluten_free"],
  ownerName: "Sam Kitchen",
  publishedAt: "2026-08-26T20:15:45.000Z",
  visibility: "public",
  ingredients: [{ rawText: "1 pound ground beef" }],
  instructions: ["Brown the beef."],
  nutrition: null,
  image: null,
} as unknown as PublishedRecipe;

describe("recipe SEO", () => {
  it("indexes only public recipes", () => {
    expect(shouldIndexRecipe({ visibility: "public" })).toBe(true);
    expect(shouldIndexRecipe({ visibility: "unlisted" })).toBe(false);
    expect(shouldIndexRecipe({ visibility: "private" })).toBe(false);
  });

  it("builds Recipe JSON-LD from data we have without inventing a dish photo", () => {
    const json = recipeJsonLd(recipe);
    expect(json["@type"]).toBe("Recipe");
    expect(json.name).toBe("Weeknight chili, thrived");
    expect(json.recipeIngredient).toEqual(["1 pound ground beef"]);
    expect(json.recipeInstructions).toEqual([
      { "@type": "HowToStep", position: 1, text: "Brown the beef." },
    ]);
    expect(json.recipeYield).toEqual(["6", "6 servings"]);
    expect(json.prepTime).toBe("PT15M");
    expect(json.cookTime).toBe("PT40M");
    expect(json.totalTime).toBe("PT55M");
    expect(json.recipeCategory).toBe("dinner");
    expect(json.recipeCuisine).toBe("American");
    expect(json.datePublished).toBe("2026-08-26T20:15:45.000Z");
    expect(json.author).toEqual({ "@type": "Person", name: "Sam Kitchen" });
    expect(json.suitableForDiet).toEqual(["https://schema.org/GlutenFreeDiet"]);
    expect(json.keywords).toContain("Weeknight");
    expect(json.keywords).not.toMatch(/American/i);
    expect(json.nutrition).toBeUndefined();
    expect(json.image).toBeUndefined();
    expect(json.isBasedOn).toMatchObject({
      "@type": "CreativeWork",
      name: "Weeknight chili",
      url: "https://example.com/chili",
      author: { "@type": "Person", name: "Pat" },
    });
  });

  it("omits generated artwork and source-less records from Recipe.image", () => {
    const generated = recipeJsonLd({
      ...recipe,
      image: {
        url: "https://cdn.example.com/gradient.png",
        alt: "Decorative cover",
        width: 1200,
        height: 800,
        source: "generated",
        credit: null,
      },
    });
    expect(generated.image).toBeUndefined();
  });

  it("includes a real food photo when one is stored", () => {
    const json = recipeJsonLd({
      ...recipe,
      image: {
        url: "https://cdn.example.com/chili.jpg",
        alt: "A bowl of chili",
        width: 1200,
        height: 800,
        source: "user_upload",
        credit: "Sam Kitchen",
      },
    });
    expect(json.image).toMatchObject({
      "@type": "ImageObject",
      url: "https://cdn.example.com/chili.jpg",
      caption: "A bowl of chili",
      creditText: "Sam Kitchen",
    });
  });

  it("uses totalTime alone when only one duration is known", () => {
    const json = recipeJsonLd({ ...recipe, prepMinutes: 12, cookMinutes: null });
    expect(json.prepTime).toBeUndefined();
    expect(json.cookTime).toBeUndefined();
    expect(json.totalTime).toBe("PT12M");
  });

  it("omits author when the Thrive Version has no owner name", () => {
    const json = recipeJsonLd({ ...recipe, ownerName: null });
    expect(json.author).toBeUndefined();
  });

  it("passes through USDA per-serving numbers only when servings exist", () => {
    const withNutrition = {
      ...recipe,
      nutrition: {
        thrive: {
          mappedCount: 4,
          assumedCount: 0,
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

  it("does not treat recipe totals as per-serving nutrition", () => {
    const totalsOnly = {
      ...recipe,
      nutrition: {
        thrive: {
          perServing: null,
          totals: {
            calories: 2400,
            proteinG: 160,
            fiberG: 40,
            fatG: 70,
            saturatedFatG: 18,
            carbsG: 200,
            sugarG: 30,
            sodiumMg: 3600,
          },
        },
      },
    } as unknown as PublishedRecipe;
    expect(recipeJsonLd(totalsOnly).nutrition).toBeUndefined();
  });

  it("does not publish unmatched USDA zeros as recipe nutrition", () => {
    const unmatched = {
      ...recipe,
      nutrition: {
        thrive: {
          mappedCount: 0,
          assumedCount: 0,
          perServing: {
            calories: 0,
            proteinG: 0,
            fiberG: 0,
            fatG: 0,
            saturatedFatG: 0,
            carbsG: 0,
            sugarG: 0,
            sodiumMg: 0,
          },
        },
      },
    } as unknown as PublishedRecipe;
    expect(recipeJsonLd(unmatched).nutrition).toBeUndefined();
  });

  it("adds aggregateRating from cook scores without inventing them", () => {
    const json = recipeJsonLd(recipe, {
      slug: recipe.slug,
      count: 3,
      tasteAverage: 4.3,
      textureAverage: 4.3,
      similarityAverage: 4.3,
      easeAverage: 4.3,
      overallAverage: 4.3,
      wouldMakeAgainCount: 3,
      wouldMakeAgainRatio: 1,
      reviewCount: 0,
      communityTested: true,
    });
    expect(json.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: "4.3",
      ratingCount: 3,
    });
    expect(recipeJsonLd(recipe).aggregateRating).toBeUndefined();
  });

  it("records that a missing dish photo blocks Google Recipe rich results", () => {
    const audit = auditGoogleRecipe(recipeJsonLd(recipe) as Record<string, unknown>);
    expect(audit.requiredPresent).toEqual(["name"]);
    expect(audit.requiredMissing).toEqual(["image"]);
    expect(audit.imagePreventsRichResults).toBe(true);
    expect(audit.eligibleForRecipeRichResults).toBe(false);
    expect(audit.recommendedPresent).toEqual(
      expect.arrayContaining([
        "author",
        "datePublished",
        "description",
        "prepTime",
        "cookTime",
        "totalTime",
        "keywords",
        "recipeYield",
        "recipeCategory",
        "recipeCuisine",
        "recipeIngredient",
        "recipeInstructions",
      ]),
    );
    expect(audit.recommendedMissing).toEqual(expect.arrayContaining(["nutrition", "aggregateRating", "video"]));
  });
});

describe("library ItemList", () => {
  it("lists only public recipe canonical URLs", () => {
    const json = libraryItemListJsonLd([
      recipe,
      { ...recipe, slug: "secret-biscuits", visibility: "private", title: "Secret biscuits" },
      { ...recipe, slug: "unlisted-tacos", visibility: "unlisted", title: "Unlisted tacos" },
    ]);
    expect(json?.["@type"]).toBe("ItemList");
    expect(json?.numberOfItems).toBe(1);
    expect(json?.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        url: "http://localhost:43123/recipes/weeknight-chili-thrived",
        name: "Weeknight chili, thrived",
      },
    ]);
  });

  it("omits ItemList when nothing public is on the shelf", () => {
    expect(
      libraryItemListJsonLd([{ ...recipe, visibility: "unlisted" }]),
    ).toBeNull();
  });
});

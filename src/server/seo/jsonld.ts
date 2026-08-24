import type { RatingSummary } from "@/server/community/policy";
import type { PublishedRecipe } from "@/server/library/schema";
import { siteUrl } from "./site";

export function shouldIndexRecipe(recipe: Pick<PublishedRecipe, "visibility">) {
  return recipe.visibility === "public";
}

export function recipeJsonLd(recipe: PublishedRecipe, ratings?: RatingSummary | null) {
  const url = `${siteUrl()}/recipes/${recipe.slug}`;
  const nutrition = recipe.nutrition?.thrive.perServing ?? recipe.nutrition?.thrive.totals;
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    url,
    recipeYield: `${recipe.servings} servings`,
    prepTime: recipe.prepMinutes ? `PT${recipe.prepMinutes}M` : undefined,
    cookTime: recipe.cookMinutes ? `PT${recipe.cookMinutes}M` : undefined,
    recipeIngredient: recipe.ingredients.map((item) => item.rawText),
    recipeInstructions: recipe.instructions.map((text, position) => ({
      "@type": "HowToStep",
      position: position + 1,
      text,
    })),
    isBasedOn: recipe.sourceUrl || recipe.originalTitle,
    nutrition: nutrition
      ? {
          "@type": "NutritionInformation",
          calories: `${Math.round(nutrition.calories)} calories`,
          proteinContent: `${nutrition.proteinG.toFixed(1)} g`,
          fiberContent: `${nutrition.fiberG.toFixed(1)} g`,
          fatContent: `${nutrition.fatG.toFixed(1)} g`,
          saturatedFatContent: `${nutrition.saturatedFatG.toFixed(1)} g`,
          carbohydrateContent: `${nutrition.carbsG.toFixed(1)} g`,
          sugarContent: `${nutrition.sugarG.toFixed(1)} g`,
          sodiumContent: `${Math.round(nutrition.sodiumMg)} mg`,
        }
      : undefined,
    aggregateRating:
      ratings && ratings.count > 0 && ratings.overallAverage != null
        ? {
            "@type": "AggregateRating",
            ratingValue: ratings.overallAverage.toFixed(1),
            ratingCount: ratings.count,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
  };
}

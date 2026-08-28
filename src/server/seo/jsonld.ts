import type { RatingSummary } from "@/server/community/policy";
import { DIETARY_COPY, type DietaryRequirementId } from "@/server/convert/schema";
import { isRecipeFoodPhoto } from "@/server/library/image";
import type { PublishedRecipe } from "@/server/library/schema";
import { nutritionSideEstimated } from "@/server/nutrition/display";
import { TAXONOMY_TAGS } from "@/server/taxonomy/tags";
import { iso8601Minutes } from "./iso8601";
import { siteUrl } from "./site";

const SCHEMA_DIETS: Partial<Record<DietaryRequirementId, string>> = {
  vegetarian: "https://schema.org/VegetarianDiet",
  vegan: "https://schema.org/VeganDiet",
  gluten_free: "https://schema.org/GlutenFreeDiet",
};

export const GOOGLE_RECIPE_REQUIRED = ["name", "image"] as const;
export const GOOGLE_RECIPE_RECOMMENDED = [
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
  "nutrition",
  "aggregateRating",
  "video",
] as const;

export function shouldIndexRecipe(recipe: Pick<PublishedRecipe, "visibility">) {
  return recipe.visibility === "public";
}

function tagMeta(slug: string) {
  return TAXONOMY_TAGS.find((tag) => tag.slug === slug) ?? null;
}

function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => compact(item))
      .filter((item) => item !== undefined && item !== null) as T;
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined || entry === null || entry === "") continue;
      if (Array.isArray(entry) && entry.length === 0) continue;
      next[key] = compact(entry);
    }
    return next as T;
  }
  return value;
}

function recipeTimes(recipe: PublishedRecipe) {
  const prepTime = iso8601Minutes(recipe.prepMinutes);
  const cookTime = iso8601Minutes(recipe.cookMinutes);
  if (prepTime && cookTime) {
    return {
      prepTime,
      cookTime,
      totalTime: iso8601Minutes((recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)),
    };
  }
  return {
    totalTime: prepTime ?? cookTime,
  };
}

function recipeCategory(recipe: PublishedRecipe) {
  if (recipe.category?.trim()) return recipe.category.trim();
  const meal = recipe.tags.map(tagMeta).find((tag) => tag?.type === "MEAL");
  return meal?.name;
}

function recipeCuisine(recipe: PublishedRecipe) {
  if (recipe.cuisine?.trim()) return recipe.cuisine.trim();
  const cuisine = recipe.tags.map(tagMeta).find((tag) => tag?.type === "CUISINE");
  return cuisine?.name;
}

function recipeKeywords(recipe: PublishedRecipe) {
  const category = recipeCategory(recipe)?.toLowerCase();
  const cuisine = recipeCuisine(recipe)?.toLowerCase();
  const fromTags = recipe.tags
    .map((slug) => tagMeta(slug))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
    .filter((tag) => tag.type !== "MEAL" && tag.type !== "CUISINE")
    .map((tag) => tag.name)
    .filter((name) => name.toLowerCase() !== category && name.toLowerCase() !== cuisine);
  const fromDiet = recipe.dietary.map((item) => DIETARY_COPY[item].label);
  const unique = [...new Set([...fromTags, ...fromDiet])];
  return unique.length > 0 ? unique.join(", ") : undefined;
}

function recipeNutritionJsonLd(recipe: PublishedRecipe) {
  const thrive = recipe.nutrition?.thrive;
  if (!thrive || !nutritionSideEstimated(thrive) || !(recipe.servings > 0)) return undefined;
  const perServing = thrive.perServing;
  if (!perServing) return undefined;
  return {
    "@type": "NutritionInformation",
    calories: `${Math.round(perServing.calories)} calories`,
    proteinContent: `${perServing.proteinG.toFixed(1)} g`,
    fiberContent: `${perServing.fiberG.toFixed(1)} g`,
    fatContent: `${perServing.fatG.toFixed(1)} g`,
    saturatedFatContent: `${perServing.saturatedFatG.toFixed(1)} g`,
    carbohydrateContent: `${perServing.carbsG.toFixed(1)} g`,
    sugarContent: `${perServing.sugarG.toFixed(1)} g`,
    sodiumContent: `${Math.round(perServing.sodiumMg)} mg`,
  };
}

function recipeImageJsonLd(recipe: PublishedRecipe) {
  const image = recipe.image;
  if (!isRecipeFoodPhoto(image)) return undefined;
  return {
    "@type": "ImageObject",
    url: image.url,
    contentUrl: image.url,
    caption: image.alt,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
    creditText: image.credit ?? undefined,
  };
}

function recipeAuthorJsonLd(recipe: PublishedRecipe) {
  if (!recipe.ownerName?.trim()) return undefined;
  return { "@type": "Person", name: recipe.ownerName.trim() };
}

function isBasedOnJsonLd(recipe: PublishedRecipe) {
  if (!recipe.sourceUrl && !recipe.originalTitle) return undefined;
  return compact({
    "@type": "CreativeWork",
    name: recipe.originalTitle || undefined,
    url: recipe.sourceUrl || undefined,
    author: recipe.sourceAuthor?.trim()
      ? { "@type": "Person", name: recipe.sourceAuthor.trim() }
      : undefined,
  });
}

export function recipeJsonLd(recipe: PublishedRecipe, ratings?: RatingSummary | null) {
  const url = `${siteUrl()}/recipes/${recipe.slug}`;
  const times = recipeTimes(recipe);
  return compact({
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    url,
    mainEntityOfPage: url,
    datePublished: recipe.publishedAt || undefined,
    author: recipeAuthorJsonLd(recipe),
    publisher: {
      "@type": "Organization",
      name: "Explore Cook Thrive",
      url: siteUrl(),
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl()}/brand/logo.png`,
      },
    },
    image: recipeImageJsonLd(recipe),
    recipeYield: [`${recipe.servings}`, `${recipe.servings} servings`],
    ...times,
    recipeCategory: recipeCategory(recipe),
    recipeCuisine: recipeCuisine(recipe),
    keywords: recipeKeywords(recipe),
    suitableForDiet: recipe.dietary
      .map((item) => SCHEMA_DIETS[item])
      .filter((item): item is string => Boolean(item)),
    recipeIngredient: recipe.ingredients.map((item) => item.rawText),
    recipeInstructions: recipe.instructions.map((text, position) => ({
      "@type": "HowToStep",
      position: position + 1,
      text,
    })),
    isBasedOn: isBasedOnJsonLd(recipe),
    nutrition: recipeNutritionJsonLd(recipe),
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
  });
}

export function libraryItemListJsonLd(
  recipes: Array<Pick<PublishedRecipe, "slug" | "title" | "visibility">>,
  options?: { name?: string; url?: string },
) {
  const publicRecipes = recipes.filter((recipe) => recipe.visibility === "public");
  if (publicRecipes.length === 0) return null;
  const base = siteUrl();
  return compact({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options?.name ?? "Explore Cook Thrive public recipe library",
    url: options?.url ?? `${base}/recipes`,
    numberOfItems: publicRecipes.length,
    itemListElement: publicRecipes.map((recipe, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${base}/recipes/${recipe.slug}`,
      name: recipe.title,
    })),
  });
}

export function auditGoogleRecipe(doc: Record<string, unknown>) {
  const present = (key: string) => {
    if (key === "nutrition") {
      const nutrition = doc.nutrition as { calories?: unknown } | undefined;
      return Boolean(nutrition && nutrition.calories);
    }
    const value = doc[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  };
  const requiredPresent = GOOGLE_RECIPE_REQUIRED.filter((key) => present(key));
  const requiredMissing = GOOGLE_RECIPE_REQUIRED.filter((key) => !present(key));
  const recommendedPresent = GOOGLE_RECIPE_RECOMMENDED.filter((key) => present(key));
  const recommendedMissing = GOOGLE_RECIPE_RECOMMENDED.filter((key) => !present(key));
  return {
    requiredPresent,
    requiredMissing,
    recommendedPresent,
    recommendedMissing,
    imagePreventsRichResults: requiredMissing.includes("image"),
    eligibleForRecipeRichResults: requiredMissing.length === 0,
  };
}

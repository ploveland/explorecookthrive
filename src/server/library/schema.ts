import { z } from "zod";
import { conversionOutputSchema } from "../ai/types";
import {
  dietaryRequirementSchema,
  nutritionGoalSchema,
  tastePreferenceSchema,
} from "../convert/schema";
import { nutritionComparisonSchema } from "../nutrition/schema";

const thriveIngredientSchema = conversionOutputSchema.shape.thriveVersion.shape.ingredients.element;
const changeSchema = conversionOutputSchema.shape.changes.element;
const keepSchema = conversionOutputSchema.shape.analysis.shape.wouldNotChange.element;

export const recipeImageSources = [
  "ect_original",
  "user_upload",
  "licensed",
  "generated",
] as const;
export type RecipeImageSource = (typeof recipeImageSources)[number];

/** Optional photo of the completed Thrive Version. Never a hotlinked source-site image. */
export const recipeImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  source: z.enum(recipeImageSources),
  credit: z.string().nullable().default(null),
});
export type RecipeImage = z.infer<typeof recipeImageSchema>;

export const publishedRecipeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  jobId: z.string(),
  title: z.string(),
  description: z.string(),
  originalTitle: z.string(),
  sourceUrl: z.string().nullable(),
  sourceSite: z.string().nullable(),
  sourceAuthor: z.string().nullable(),
  servings: z.number().positive(),
  prepMinutes: z.number().nullable(),
  cookMinutes: z.number().nullable(),
  cuisine: z.string().nullable(),
  category: z.string().nullable(),
  goals: z.array(nutritionGoalSchema),
  dietary: z.array(dietaryRequirementSchema),
  preference: tastePreferenceSchema,
  tasteImpact: z.enum(["minimal", "moderate", "significant"]),
  tags: z.array(z.string()),
  ingredients: z.array(thriveIngredientSchema),
  instructions: z.array(z.string()),
  changes: z.array(changeSchema),
  wouldNotChange: z.array(keepSchema),
  nutrition: nutritionComparisonSchema.nullable(),
  provider: z.enum(["openai", "mock"]),
  ownerId: z.string().nullable().default(null),
  ownerName: z.string().nullable().default(null),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  publishedAt: z.string(),
  image: recipeImageSchema.nullable().default(null),
});

export type PublishedRecipe = z.infer<typeof publishedRecipeSchema>;

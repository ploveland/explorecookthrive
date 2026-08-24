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
  publishedAt: z.string(),
});

export type PublishedRecipe = z.infer<typeof publishedRecipeSchema>;

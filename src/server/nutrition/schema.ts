import { z } from "zod";

export const nutrientTotalsSchema = z.object({
  calories: z.number(),
  proteinG: z.number(),
  fatG: z.number(),
  saturatedFatG: z.number(),
  carbsG: z.number(),
  fiberG: z.number(),
  sugarG: z.number(),
  sodiumMg: z.number(),
});

export type NutrientTotals = z.infer<typeof nutrientTotalsSchema>;

export const nutritionConfidenceSchema = z.enum(["high", "medium", "low"]);
export type NutritionConfidence = z.infer<typeof nutritionConfidenceSchema>;

export const ingredientNutritionSchema = z.object({
  rawText: z.string(),
  matchedName: z.string().nullable(),
  fdcId: z.number().nullable(),
  grams: z.number().nullable(),
  nutrients: nutrientTotalsSchema.nullable(),
  status: z.enum(["mapped", "assumed", "ignored", "unmapped"]),
  note: z.string().nullable(),
});

export type IngredientNutrition = z.infer<typeof ingredientNutritionSchema>;

export const recipeNutritionSchema = z.object({
  servings: z.number().positive().nullable(),
  totals: nutrientTotalsSchema,
  perServing: nutrientTotalsSchema.nullable(),
  confidence: nutritionConfidenceSchema,
  mappedCount: z.number().int().nonnegative(),
  unmappedCount: z.number().int().nonnegative(),
  assumedCount: z.number().int().nonnegative(),
  ingredients: z.array(ingredientNutritionSchema),
  notes: z.array(z.string()),
});

export type RecipeNutrition = z.infer<typeof recipeNutritionSchema>;

export const nutritionComparisonSchema = z.object({
  source: z.enum(["usda_fdc", "usda_fdc_local"]),
  sourceLabel: z.string(),
  original: recipeNutritionSchema,
  thrive: recipeNutritionSchema,
  deltaPerServing: nutrientTotalsSchema.nullable(),
});

export type NutritionComparison = z.infer<typeof nutritionComparisonSchema>;

export function emptyNutrients(): NutrientTotals {
  return {
    calories: 0,
    proteinG: 0,
    fatG: 0,
    saturatedFatG: 0,
    carbsG: 0,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 0,
  };
}

export function addNutrients(a: NutrientTotals, b: NutrientTotals): NutrientTotals {
  return {
    calories: a.calories + b.calories,
    proteinG: a.proteinG + b.proteinG,
    fatG: a.fatG + b.fatG,
    saturatedFatG: a.saturatedFatG + b.saturatedFatG,
    carbsG: a.carbsG + b.carbsG,
    fiberG: a.fiberG + b.fiberG,
    sugarG: a.sugarG + b.sugarG,
    sodiumMg: a.sodiumMg + b.sodiumMg,
  };
}

export function scaleNutrients(n: NutrientTotals, factor: number): NutrientTotals {
  return {
    calories: n.calories * factor,
    proteinG: n.proteinG * factor,
    fatG: n.fatG * factor,
    saturatedFatG: n.saturatedFatG * factor,
    carbsG: n.carbsG * factor,
    fiberG: n.fiberG * factor,
    sugarG: n.sugarG * factor,
    sodiumMg: n.sodiumMg * factor,
  };
}

export function subtractNutrients(a: NutrientTotals, b: NutrientTotals): NutrientTotals {
  return {
    calories: a.calories - b.calories,
    proteinG: a.proteinG - b.proteinG,
    fatG: a.fatG - b.fatG,
    saturatedFatG: a.saturatedFatG - b.saturatedFatG,
    carbsG: a.carbsG - b.carbsG,
    fiberG: a.fiberG - b.fiberG,
    sugarG: a.sugarG - b.sugarG,
    sodiumMg: a.sodiumMg - b.sodiumMg,
  };
}

export function roundNutrients(n: NutrientTotals): NutrientTotals {
  return {
    calories: Math.round(n.calories),
    proteinG: Math.round(n.proteinG * 10) / 10,
    fatG: Math.round(n.fatG * 10) / 10,
    saturatedFatG: Math.round(n.saturatedFatG * 10) / 10,
    carbsG: Math.round(n.carbsG * 10) / 10,
    fiberG: Math.round(n.fiberG * 10) / 10,
    sugarG: Math.round(n.sugarG * 10) / 10,
    sodiumMg: Math.round(n.sodiumMg),
  };
}

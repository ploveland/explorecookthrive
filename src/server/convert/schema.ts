import { z } from "zod";
import { conversionOutputSchema } from "../ai/types";
import { nutritionComparisonSchema } from "../nutrition/schema";
import { extractedRecipeSchema } from "../recipes/schema";
import { storageUuidSchema } from "../fs/ids";

export const nutritionGoals = [
  "healthier_overall",
  "lower_calories",
  "higher_protein",
  "more_fiber",
  "lower_saturated_fat",
  "lower_sodium",
  "lower_added_sugar",
] as const;

export const dietaryRequirements = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "dairy_free",
] as const;

export const tastePreferences = ["preserve", "balanced", "maximum"] as const;

export const conversionJobStatuses = [
  "queued",
  "reading",
  "understanding",
  "improving",
  "estimating",
  "protecting",
  "creating",
  "complete",
  "failed",
] as const;

export const nutritionGoalSchema = z.enum(nutritionGoals);
export const dietaryRequirementSchema = z.enum(dietaryRequirements);
export const tastePreferenceSchema = z.enum(tastePreferences);
export const conversionJobStatusSchema = z.enum(conversionJobStatuses);

export type NutritionGoalId = z.infer<typeof nutritionGoalSchema>;
export type DietaryRequirementId = z.infer<typeof dietaryRequirementSchema>;
export type TastePreferenceId = z.infer<typeof tastePreferenceSchema>;
export type ConversionJobStatus = z.infer<typeof conversionJobStatusSchema>;

export const GOAL_COPY: Record<
  NutritionGoalId,
  { label: string; detail: string }
> = {
  healthier_overall: {
    label: "Healthier overall",
    detail: "Look for upgrades that earn their keep without flattening the dish.",
  },
  lower_calories: {
    label: "Lower calories",
    detail: "Trim excess where it will not erase flavor, crust, or structure.",
  },
  higher_protein: {
    label: "Higher protein",
    detail: "Add protein that belongs in this cuisine — not a powder dumped on top.",
  },
  more_fiber: {
    label: "More fiber",
    detail: "Beans, a second flour, or vegetables when they make culinary sense.",
  },
  lower_saturated_fat: {
    label: "Lower saturated fat",
    detail: "Technique and portion first. Do not swap out the fat that is the dish.",
  },
  lower_sodium: {
    label: "Lower sodium",
    detail: "Measure salt. Finish with acid and aroma instead of a salt bomb.",
  },
  lower_added_sugar: {
    label: "Lower added sugar",
    detail: "Nudge sugar when it is extra. Leave it when it is structure.",
  },
};

export const PREFERENCE_COPY: Record<
  TastePreferenceId,
  { label: string; detail: string }
> = {
  preserve: {
    label: "Keep the taste",
    detail: "Stay as close as possible to the original. Small, quiet moves only.",
  },
  balanced: {
    label: "Balanced",
    detail: "Improve nutrition without turning this into a different recipe.",
  },
  maximum: {
    label: "Push further",
    detail: "Go further on the goals, still with no cheap diet swaps.",
  },
};

export const DIETARY_COPY: Record<DietaryRequirementId, { label: string; detail: string }> = {
  vegetarian: {
    label: "Vegetarian",
    detail: "No meat, poultry, or fish.",
  },
  vegan: {
    label: "Vegan",
    detail: "No animal products — and we will not fake a dish that cannot be itself.",
  },
  gluten_free: {
    label: "Gluten-free",
    detail: "Only if a gluten-free version can still cook correctly.",
  },
  dairy_free: {
    label: "Dairy-free",
    detail: "Skip dairy when it is optional; keep it when it is the sauce.",
  },
};

export const convertRequestSchema = z.object({
  draftId: storageUuidSchema,
  goals: z.array(nutritionGoalSchema).min(1, "Pick at least one nutrition goal."),
  preference: tastePreferenceSchema.default("balanced"),
  dietary: z.array(dietaryRequirementSchema).default([]),
});

export type ConvertRequest = z.infer<typeof convertRequestSchema>;

export const convertIngredientSchema = z.object({
  rawText: z.string(),
  name: z.string().nullable(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  preparation: z.string().nullable(),
});

export const convertRecipeInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  servings: z.number().positive().nullable(),
  prepMinutes: z.number().nullable(),
  cookMinutes: z.number().nullable(),
  ingredients: z.array(convertIngredientSchema).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  goals: z.array(nutritionGoalSchema).min(1),
  preference: tastePreferenceSchema,
  dietary: z.array(dietaryRequirementSchema),
});

export type ConvertRecipeInput = z.infer<typeof convertRecipeInputSchema>;

export const conversionJobSchema = z.object({
  id: z.string(),
  draftId: z.string(),
  recipe: extractedRecipeSchema,
  goals: z.array(nutritionGoalSchema),
  dietary: z.array(dietaryRequirementSchema),
  preference: tastePreferenceSchema,
  status: conversionJobStatusSchema,
  statusLabel: z.string(),
  provider: z.enum(["openai", "mock"]),
  model: z.string(),
  promptVersion: z.string(),
  output: conversionOutputSchema.nullable(),
  nutrition: nutritionComparisonSchema.nullable().default(null),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  latencyMs: z.number().nullable(),
  guestId: z.string().nullable().default(null),
  userId: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ConversionJob = z.infer<typeof conversionJobSchema>;

export const PROMPT_VERSION = "thrive-conversion-v2";

export const ACTIVE_JOB_STAGES: { status: ConversionJobStatus; label: string }[] = [
  { status: "reading", label: "Reading the recipe you confirmed" },
  { status: "understanding", label: "Naming flavor, texture, and structure" },
  { status: "improving", label: "Looking for upgrades that earn their keep" },
  { status: "protecting", label: "Protecting the parts that make this dish itself" },
  { status: "creating", label: "Writing the Thrive Version" },
  { status: "estimating", label: "Estimating nutrition with USDA FoodData Central" },
];

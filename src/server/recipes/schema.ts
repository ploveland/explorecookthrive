import { z } from "zod";

export const extractedIngredientSchema = z.object({
  rawText: z.string().min(1),
  name: z.string().nullable(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  preparation: z.string().nullable(),
});

export const extractedRecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  servings: z.number().positive().nullable(),
  prepMinutes: z.number().nonnegative().nullable(),
  cookMinutes: z.number().nonnegative().nullable(),
  cuisine: z.string().nullable(),
  category: z.string().nullable(),
  ingredients: z.array(extractedIngredientSchema).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  sourceUrl: z.string().nullable(),
  sourceSite: z.string().nullable(),
  sourceAuthor: z.string().nullable(),
  originalTitle: z.string().nullable(),
  extractor: z.enum(["jsonld", "html", "paste", "ai"]),
  confidence: z.enum(["high", "medium", "low"]),
  warnings: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type ExtractedIngredient = z.infer<typeof extractedIngredientSchema>;
export type ExtractedRecipe = z.infer<typeof extractedRecipeSchema>;

export const extractRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("paste"),
    text: z.string().min(20, "Paste a full recipe, including ingredients and steps."),
  }),
  z.object({
    mode: z.literal("url"),
    url: z.string().min(8),
  }),
]);

export type ExtractRequest = z.infer<typeof extractRequestSchema>;

export const recipeDraftSchema = z.object({
  id: z.string(),
  recipe: extractedRecipeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RecipeDraft = z.infer<typeof recipeDraftSchema>;

export type ExtractErrorCode =
  | "invalid_url"
  | "blocked_url"
  | "fetch_failed"
  | "not_a_recipe"
  | "extract_failed";

export class ExtractError extends Error {
  constructor(
    public readonly code: ExtractErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ExtractError";
  }
}

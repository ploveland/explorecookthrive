import { z } from "zod";

export const conversionOutputSchema = z.object({
  analysis: z.object({
    flavorDrivers: z.array(z.string()).min(1),
    textureDrivers: z.array(z.string()).min(1),
    structureDrivers: z.array(z.string()).min(1),
    highImpactOpportunities: z.array(z.string()).min(1),
    wouldNotChange: z
      .array(
        z.object({
          item: z.string(),
          reason: z.string(),
        }),
      )
      .min(1),
    tasteImpact: z.enum(["minimal", "moderate", "significant"]),
    assumptions: z.array(z.string()),
  }),
  thriveVersion: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    servings: z.number().positive(),
    prepMinutes: z.number().nullable(),
    cookMinutes: z.number().nullable(),
    ingredients: z
      .array(
        z.object({
          rawText: z.string(),
          name: z.string(),
          quantity: z.number().nullable(),
          unit: z.string().nullable(),
          preparation: z.string().nullable(),
          assumptionNote: z.string().nullable(),
        }),
      )
      .min(1),
    instructions: z.array(z.string()).min(1),
  }),
  changes: z
    .array(
      z.object({
        original: z.string(),
        suggested: z.string(),
        nutritionReason: z.string(),
        flavorEffect: z.string(),
        textureEffect: z.string(),
      }),
    )
    .min(1),
});

export type ConversionOutput = z.infer<typeof conversionOutputSchema>;

export type LlmUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type GenerateObjectParams<T> = {
  schema: z.ZodType<T>;
  schemaName: string;
  system: string;
  prompt: string;
};

export interface LlmClient {
  readonly provider: "openai" | "anthropic";
  readonly model: string;
  generateObject<T>(params: GenerateObjectParams<T>): Promise<{
    object: T;
    usage: LlmUsage;
  }>;
}

export class LlmConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmConfigurationError";
  }
}

export class LlmValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmValidationError";
  }
}

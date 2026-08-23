import { createLlmClient, conversionOutputSchema } from "../ai";
import type { ConversionOutput } from "../ai/types";
import { log } from "../log";
import { mockConvert } from "./mock";
import { CONVERSION_SYSTEM_PROMPT, buildConversionPrompt } from "./prompt";
import { PROMPT_VERSION, type ConvertRecipeInput } from "./schema";

export type ConversionRun = {
  output: ConversionOutput;
  provider: "openai" | "mock";
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
};

export function hasLiveLlm() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function runConversion(input: ConvertRecipeInput): Promise<ConversionRun> {
  const started = Date.now();

  if (!hasLiveLlm()) {
    const output = conversionOutputSchema.parse(mockConvert(input));
    log.info("convert.run", {
      provider: "mock",
      model: "culinary-mock-v1",
      operation: "thrive_conversion",
      success: true,
      latencyMs: Date.now() - started,
    });
    return {
      output,
      provider: "mock",
      model: "culinary-mock-v1",
      promptVersion: PROMPT_VERSION,
      inputTokens: null,
      outputTokens: null,
      latencyMs: Date.now() - started,
    };
  }

  const client = createLlmClient();
  const result = await client.generateObject({
    schema: conversionOutputSchema,
    schemaName: "thrive_conversion",
    system: CONVERSION_SYSTEM_PROMPT,
    prompt: buildConversionPrompt(input),
  });

  return {
    output: result.object,
    provider: "openai",
    model: client.model,
    promptVersion: PROMPT_VERSION,
    inputTokens: result.usage.inputTokens ?? null,
    outputTokens: result.usage.outputTokens ?? null,
    latencyMs: Date.now() - started,
  };
}

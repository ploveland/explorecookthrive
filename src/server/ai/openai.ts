import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { log } from "../log";
import {
  type LlmClient,
  LlmConfigurationError,
  LlmValidationError,
  type GenerateObjectParams,
} from "./types";

export class OpenAiLlmClient implements LlmClient {
  readonly provider = "openai" as const;
  readonly model: string;
  private readonly apiKey: string;

  constructor(model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new LlmConfigurationError(
        "OPENAI_API_KEY is not set. Add it to .env.local before running conversions.",
      );
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateObject<T>(params: GenerateObjectParams<T>) {
    const started = Date.now();
    const openai = createOpenAI({ apiKey: this.apiKey });

    try {
      const result = await generateObject({
        model: openai(this.model),
        schema: params.schema,
        schemaName: params.schemaName,
        system: params.system,
        prompt: params.prompt,
      });

      const parsed = params.schema.safeParse(result.object);
      if (!parsed.success) {
        throw new LlmValidationError(
          `Model output failed schema ${params.schemaName}: ${parsed.error.message}`,
        );
      }

      const usage = {
        inputTokens: result.usage?.inputTokens,
        outputTokens: result.usage?.outputTokens,
      };

      log.info("llm.generate_object", {
        provider: this.provider,
        model: this.model,
        operation: params.schemaName,
        success: true,
        latencyMs: Date.now() - started,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      });

      return { object: parsed.data, usage };
    } catch (error) {
      log.error("llm.generate_object", {
        provider: this.provider,
        model: this.model,
        operation: params.schemaName,
        success: false,
        latencyMs: Date.now() - started,
        errorCode: error instanceof Error ? error.name : "unknown",
      });
      throw error;
    }
  }
}

export function createLlmClient(): LlmClient {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider === "openai") {
    return new OpenAiLlmClient();
  }
  throw new LlmConfigurationError(
    `Unsupported AI_PROVIDER "${provider}". Phase 1 supports openai; anthropic is reserved.`,
  );
}

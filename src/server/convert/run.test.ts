import { afterEach, describe, expect, it } from "vitest";
import { env } from "../env";
import { hasLiveLlm } from "./run";

describe("live LLM detection", () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("treats a missing or blank key as the culinary mock", () => {
    delete process.env.OPENAI_API_KEY;
    expect(hasLiveLlm()).toBe(false);
    process.env.OPENAI_API_KEY = "   ";
    expect(hasLiveLlm()).toBe(false);
    expect(env("OPENAI_API_KEY")).toBe("");
  });

  it("sees a key set at runtime, not only at boot", () => {
    process.env.OPENAI_API_KEY = "sk-test-runtime";
    expect(hasLiveLlm()).toBe(true);
    expect(env("OPENAI_API_KEY")).toBe("sk-test-runtime");
  });
});

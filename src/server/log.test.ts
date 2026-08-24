import { afterEach, describe, expect, it, vi } from "vitest";
import { log } from "./log";

describe("log sanitizer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("strips recipe bodies and prompts from structured logs", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    log.info("convert.job_complete", {
      jobId: "abc",
      ingredients: "1 cup butter",
      instructions: "Cream the butter.",
      prompt: "secret",
      recipe: "private body",
      success: true,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(payload.jobId).toBe("abc");
    expect(payload.success).toBe(true);
    expect(payload.ingredients).toBeUndefined();
    expect(payload.instructions).toBeUndefined();
    expect(payload.prompt).toBeUndefined();
    expect(payload.recipe).toBeUndefined();
  });
});

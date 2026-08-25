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
      comment: "Still tasted like chili.",
      token: "reset-secret",
      password: "cornbread1",
      access_token: "ya29.hidden",
      id_token: "eyJhidden",
      refresh_token: "1//hidden",
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
    expect(payload.comment).toBeUndefined();
    expect(payload.token).toBeUndefined();
    expect(payload.password).toBeUndefined();
    expect(payload.access_token).toBeUndefined();
    expect(payload.id_token).toBeUndefined();
    expect(payload.refresh_token).toBeUndefined();
  });
});

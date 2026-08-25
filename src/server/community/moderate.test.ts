import { describe, expect, it } from "vitest";
import { moderateComment } from "./moderate";

describe("cook note moderation", () => {
  it("allows a short note about the dish", () => {
    expect(moderateComment("  Beans still belonged.  ")).toEqual({
      ok: true,
      comment: "Beans still belonged.",
    });
    expect(moderateComment("   ")).toEqual({ ok: true, comment: null });
  });

  it("rejects links, emails, and ads", () => {
    expect(moderateComment("See https://spam.example for the mix.").ok).toBe(false);
    expect(moderateComment("Email me at bot@example.com").ok).toBe(false);
    expect(moderateComment("Buy now — this crypto trick changed my kitchen.").ok).toBe(false);
  });

  it("rejects abusive wording", () => {
    expect(moderateComment("This recipe is shit.").ok).toBe(false);
  });
});

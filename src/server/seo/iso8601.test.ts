import { describe, expect, it } from "vitest";
import { iso8601Minutes } from "./iso8601";

describe("iso8601Minutes", () => {
  it("formats positive minutes and skips missing values", () => {
    expect(iso8601Minutes(15)).toBe("PT15M");
    expect(iso8601Minutes(0)).toBeUndefined();
    expect(iso8601Minutes(null)).toBeUndefined();
  });
});

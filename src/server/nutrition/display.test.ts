import { describe, expect, it } from "vitest";
import { nutritionSideEstimated } from "./display";

describe("nutritionSideEstimated", () => {
  it("is false when nothing mapped, so zeros are not a real estimate", () => {
    expect(nutritionSideEstimated({ mappedCount: 0, assumedCount: 0 })).toBe(false);
  });

  it("is true when at least one ingredient mapped or assumed", () => {
    expect(nutritionSideEstimated({ mappedCount: 1, assumedCount: 0 })).toBe(true);
    expect(nutritionSideEstimated({ mappedCount: 0, assumedCount: 2 })).toBe(true);
  });
});

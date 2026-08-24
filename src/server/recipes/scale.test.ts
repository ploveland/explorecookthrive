import { describe, expect, it } from "vitest";
import { formatQuantity, scaleIngredientText, servingFactor } from "./scale";

describe("serving scale", () => {
  it("scales a measured ingredient from 6 to 8 servings", () => {
    const factor = servingFactor(6, 8);
    const scaled = scaleIngredientText(
      {
        rawText: "1 pound ground beef",
        name: "ground beef",
        quantity: 1,
        unit: "pound",
        preparation: null,
      },
      factor,
    );
    expect(factor).toBeCloseTo(8 / 6);
    expect(scaled.scaled).toBe(true);
    expect(scaled.text).toBe("1⅓ pound ground beef");
  });

  it("leaves unmeasured lines as written", () => {
    const scaled = scaleIngredientText(
      {
        rawText: "salt to taste",
        name: "salt",
        quantity: null,
        unit: null,
        preparation: null,
      },
      2,
    );
    expect(scaled.scaled).toBe(false);
    expect(scaled.text).toBe("salt to taste");
  });

  it("formats common kitchen fractions", () => {
    expect(formatQuantity(0.5)).toBe("½");
    expect(formatQuantity(1.5)).toBe("1½");
    expect(formatQuantity(2)).toBe("2");
  });
});

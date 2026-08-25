import { describe, expect, it } from "vitest";
import { findCatalogFood } from "./catalog";
import { toGrams } from "./grams";

describe("ingredient grams", () => {
  it("converts a cup of all-purpose flour to 120g", () => {
    const food = findCatalogFood("all-purpose flour");
    expect(food).not.toBeNull();
    const result = toGrams(1, "cup", food);
    expect(result.grams).toBe(120);
    expect(result.assumed).toBe(false);
  });

  it("converts two tablespoons of olive oil", () => {
    const food = findCatalogFood("olive oil");
    const result = toGrams(2, "tbsp", food);
    expect(result.grams).toBeCloseTo(27, 0);
  });

  it("uses a typical weight for one onion", () => {
    const food = findCatalogFood("onion");
    const result = toGrams(1, null, food);
    expect(result.grams).toBe(110);
    expect(result.assumed).toBe(true);
  });

  it("converts a pound of ground beef", () => {
    const food = findCatalogFood("ground beef");
    const result = toGrams(1, "pound", food);
    expect(result.grams).toBeCloseTo(453.6, 0);
  });

  it("counts a whole chicken as a bird, not a piece", () => {
    const food = findCatalogFood("whole chicken");
    expect(food?.id).toBe("chicken-whole");
    const result = toGrams(1, null, food, "1 whole chicken, cut up");
    expect(result.grams).toBe(1600);
  });

  it("recovers oz from a punctuated line when the unit field is empty", () => {
    const food = findCatalogFood("cream cheese");
    expect(food?.id).toBe("cream-cheese");
    const result = toGrams(8, null, food, "8 oz. cream cheese");
    expect(result.grams).toBeCloseTo(226.8, 0);
  });
});

import { describe, expect, it } from "vitest";
import { emptyNutrients, type NutritionComparison } from "../nutrition/schema";
import { matchesNutritionFilters, parseNutritionFilters, libraryHref } from "./nutrition-filter";

function recipe(thrive: { calories: number; proteinG: number; fiberG: number; sodiumMg: number }) {
  const nutrition = {
    source: "usda_fdc_local",
    sourceLabel: "USDA local catalog",
    original: {
      servings: 4,
      totals: emptyNutrients(),
      perServing: emptyNutrients(),
      confidence: "high",
      mappedCount: 1,
      unmappedCount: 0,
      assumedCount: 0,
      ingredients: [],
      notes: [],
    },
    thrive: {
      servings: 4,
      totals: { ...emptyNutrients(), ...thrive },
      perServing: { ...emptyNutrients(), ...thrive },
      confidence: "high",
      mappedCount: 1,
      unmappedCount: 0,
      assumedCount: 0,
      ingredients: [],
      notes: [],
    },
    deltaPerServing: emptyNutrients(),
  } as NutritionComparison;
  return { nutrition };
}

describe("nutrition filters", () => {
  it("parses only positive bounds", () => {
    expect(parseNutritionFilters({ maxCal: "600", minProtein: "30", minFiber: "0", maxSodium: "-1" })).toEqual({
      maxCalories: 600,
      minProtein: 30,
      minFiber: null,
      maxSodium: null,
    });
  });

  it("keeps a thrive recipe that meets USDA per-serving bounds", () => {
    expect(
      matchesNutritionFilters(recipe({ calories: 480, proteinG: 34, fiberG: 9, sodiumMg: 520 }), {
        maxCalories: 600,
        minProtein: 30,
        minFiber: 8,
        maxSodium: 600,
      }),
    ).toBe(true);
  });

  it("does not treat missing USDA numbers as a match", () => {
    expect(
      matchesNutritionFilters(
        { nutrition: null },
        { maxCalories: 600, minProtein: null, minFiber: null, maxSodium: null },
      ),
    ).toBe(false);
  });

  it("does not treat an unmatched thrive estimate as under the calorie bound", () => {
    const unmatched = recipe({ calories: 0, proteinG: 0, fiberG: 0, sodiumMg: 0 });
    unmatched.nutrition.thrive.mappedCount = 0;
    unmatched.nutrition.thrive.assumedCount = 0;
    unmatched.nutrition.thrive.unmappedCount = 6;
    expect(
      matchesNutritionFilters(unmatched, {
        maxCalories: 500,
        minProtein: null,
        minFiber: null,
        maxSodium: null,
      }),
    ).toBe(false);
  });

  it("rejects a calorie count above the bound", () => {
    expect(
      matchesNutritionFilters(recipe({ calories: 900, proteinG: 40, fiberG: 10, sodiumMg: 400 }), {
        maxCalories: 600,
        minProtein: null,
        minFiber: null,
        maxSodium: null,
      }),
    ).toBe(false);
  });

  it("builds shareable library URLs", () => {
    expect(
      libraryHref({
        tag: "weeknight",
        nutrition: { maxCalories: 500, minProtein: 30, minFiber: null, maxSodium: null },
      }),
    ).toBe("/recipes?maxCal=500&minProtein=30&tag=weeknight");
  });
});

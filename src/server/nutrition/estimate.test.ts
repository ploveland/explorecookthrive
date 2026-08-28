import { describe, expect, it } from "vitest";
import { compareRecipeNutrition, estimateRecipeNutrition } from "./estimate";
import { findCatalogFood } from "./catalog";

describe("USDA recipe estimates", () => {
  it("estimates a measured flour-and-butter dough", async () => {
    const result = await estimateRecipeNutrition(
      [
        { rawText: "1 cup all-purpose flour", name: "all-purpose flour", quantity: 1, unit: "cup" },
        { rawText: "4 tablespoons unsalted butter", name: "unsalted butter", quantity: 4, unit: "tablespoon" },
        { rawText: "1/2 teaspoon salt", name: "salt", quantity: 0.5, unit: "teaspoon" },
      ],
      4,
    );

    expect(result.confidence).toBe("high");
    expect(result.unmappedCount).toBe(0);
    expect(result.totals.calories).toBeGreaterThan(400);
    expect(result.perServing?.calories).toBeGreaterThan(100);
    expect(result.ingredients.every((item) => item.fdcId)).toBe(true);
  });

  it("shows more fiber when beans are added to chili", async () => {
    const original = [
      { rawText: "1 pound ground beef", name: "ground beef", quantity: 1, unit: "pound" },
      { rawText: "1 onion", name: "onion", quantity: 1, unit: null },
      { rawText: "1 can kidney beans", name: "kidney beans", quantity: 1, unit: "can" },
    ];
    const thrive = [
      ...original,
      { rawText: "1 can black beans, drained", name: "black beans", quantity: 1, unit: "can" },
    ];

    const comparison = await compareRecipeNutrition({
      original,
      originalServings: 6,
      thrive,
      thriveServings: 6,
    });

    expect(comparison.source).toBe("usda_fdc_local");
    expect(comparison.thrive.totals.fiberG).toBeGreaterThan(comparison.original.totals.fiberG);
    expect(comparison.deltaPerServing?.fiberG).toBeGreaterThan(0);
  });

  it("ignores tools and reports unmapped foods", async () => {
    const result = await estimateRecipeNutrition(
      [
        { rawText: "1 instant-read thermometer", name: "instant-read thermometer", quantity: 1, unit: null },
        { rawText: "2 teaspoons msg-free fairy dust", name: "fairy dust", quantity: 2, unit: "teaspoon" },
      ],
      2,
    );

    expect(result.ingredients[0]?.status).toBe("ignored");
    expect(result.ingredients[1]?.status).toBe("unmapped");
    expect(result.unmappedCount).toBe(1);
    expect(result.totals.calories).toBe(0);
  });

  it("does not undercount kitchen-style original lines", async () => {
    const messy = await estimateRecipeNutrition(
      [
        { rawText: "1 lb. ground beef", name: "lb. ground beef", quantity: 1, unit: null },
        { rawText: "1 (15 oz) can black beans, drained", name: "(15 oz) can black beans", quantity: 1, unit: null },
        { rawText: "1½ cups all-purpose flour", name: "1½ cups all-purpose flour", quantity: null, unit: null },
        { rawText: "1 whole chicken, cut up", name: "chicken", quantity: 1, unit: "whole" },
        { rawText: "8 oz. cream cheese", name: "oz. cream cheese", quantity: 8, unit: null },
        { rawText: "1 cup yellow cornmeal", name: "yellow cornmeal", quantity: 1, unit: "cup" },
        { rawText: "1 1/2 pounds cube steak", name: "cube steak", quantity: 1.5, unit: "pounds" },
      ],
      6,
    );

    const calories = Object.fromEntries(
      messy.ingredients.map((item) => [item.rawText, item.nutrients?.calories ?? 0]),
    );
    expect(messy.unmappedCount).toBe(0);
    expect(calories["1 lb. ground beef"]).toBeGreaterThan(1000);
    expect(calories["1 (15 oz) can black beans, drained"]).toBeGreaterThan(150);
    expect(calories["1½ cups all-purpose flour"]).toBeGreaterThan(400);
    expect(calories["1 whole chicken, cut up"]).toBeGreaterThan(2500);
    expect(calories["8 oz. cream cheese"]).toBeGreaterThan(700);
    expect(calories["1 cup yellow cornmeal"]).toBeGreaterThan(500);
    expect(calories["1 1/2 pounds cube steak"]).toBeGreaterThan(1500);
    expect(findCatalogFood("cream cheese")?.id).toBe("cream-cheese");
    expect(findCatalogFood("homemade chicken broth")?.id).toBe("broth");
  });

  it("does not treat an unmatched original as a zero-calorie baseline", async () => {
    const comparison = await compareRecipeNutrition({
      original: [
        {
          rawText: "a pinch of mystery spice blend",
          name: "mystery spice blend",
          quantity: 1,
          unit: "pinch",
        },
      ],
      originalServings: 4,
      thrive: [
        { rawText: "1 cup all-purpose flour", name: "all-purpose flour", quantity: 1, unit: "cup" },
        { rawText: "4 tablespoons unsalted butter", name: "unsalted butter", quantity: 4, unit: "tablespoon" },
      ],
      thriveServings: 4,
    });

    expect(comparison.original.mappedCount + comparison.original.assumedCount).toBe(0);
    expect(comparison.original.totals.calories).toBe(0);
    expect(comparison.thrive.totals.calories).toBeGreaterThan(400);
    expect(comparison.deltaPerServing).toBeNull();
    expect(comparison.original.notes.join(" ")).toMatch(/missing — not zero/i);
  });
});

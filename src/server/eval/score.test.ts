import { describe, expect, it } from "vitest";
import type { ConversionOutput } from "../ai/types";
import { loadEvalCases } from "./load-cases";
import { scoreConversion } from "./score";

const cases = loadEvalCases();

function baseOutput(overrides: Partial<ConversionOutput> = {}): ConversionOutput {
  const output: ConversionOutput = {
    analysis: {
      flavorDrivers: ["browned butter", "buttermilk tang"],
      textureDrivers: ["cold butter shards"],
      structureDrivers: ["gluten and steam"],
      highImpactOpportunities: ["weigh flour instead of scooping"],
      wouldNotChange: [{ item: "butter", reason: "Butter is the flake and the flavor." }],
      tasteImpact: "minimal",
      assumptions: [],
    },
    thriveVersion: {
      title: "Buttermilk biscuits, lightly tuned",
      description: "Same biscuits. Better flour measuring.",
      servings: 8,
      prepMinutes: 15,
      cookMinutes: 14,
      ingredients: [
        {
          rawText: "2 cups all-purpose flour",
          name: "all-purpose flour",
          quantity: 240,
          unit: "g",
          preparation: null,
          assumptionNote: "Weighed a typical cup of flour.",
        },
        {
          rawText: "8 tablespoons cold unsalted butter",
          name: "unsalted butter",
          quantity: 8,
          unit: "tablespoon",
          preparation: "cold",
          assumptionNote: null,
        },
        {
          rawText: "3/4 cup buttermilk",
          name: "buttermilk",
          quantity: 0.75,
          unit: "cup",
          preparation: null,
          assumptionNote: null,
        },
      ],
      instructions: ["Keep the butter cold. Cut, fold, bake hot."],
    },
    changes: [
      {
        original: "Scooped flour",
        suggested: "Weigh 240g flour",
        nutritionReason: "Stops an extra quarter-cup of flour from sneaking in.",
        flavorEffect: "Taste stays the same.",
        textureEffect: "Still tender, a little less dense.",
      },
    ],
  };

  return {
    ...output,
    ...overrides,
    analysis: { ...output.analysis, ...(overrides.analysis ?? {}) },
    thriveVersion: { ...output.thriveVersion, ...(overrides.thriveVersion ?? {}) },
    changes: overrides.changes ?? output.changes,
  };
}

describe("conversion eval suite", () => {
  it("loads first-class culinary fixtures", () => {
    expect(cases.map((item) => item.id).sort()).toEqual([
      "buttermilk-biscuits-keep-butter",
      "carbonara-no-skim-cream",
      "chili-no-invented-ingredients",
      "chocolate-layer-cake-no-applesauce",
      "fried-chicken-keep-crust",
    ]);
  });

  it("passes a conversion that keeps butter and avoids diet swaps", () => {
    const biscuitCase = cases.find((item) => item.id === "buttermilk-biscuits-keep-butter");
    expect(biscuitCase).toBeDefined();
    const result = scoreConversion(biscuitCase!, baseOutput());
    expect(result.deductions).toEqual([]);
    expect(result.pass).toBe(true);
  });

  it("fails applesauce in biscuits", () => {
    const biscuitCase = cases.find((item) => item.id === "buttermilk-biscuits-keep-butter")!;
    const result = scoreConversion(
      biscuitCase,
      baseOutput({
        thriveVersion: {
          title: "Applesauce biscuits",
          description: "A different pastry.",
          servings: 8,
          prepMinutes: 15,
          cookMinutes: 14,
          ingredients: [
            {
              rawText: "1/2 cup applesauce",
              name: "applesauce",
              quantity: 0.5,
              unit: "cup",
              preparation: null,
              assumptionNote: null,
            },
          ],
          instructions: ["Stir and bake."],
        },
        analysis: {
          flavorDrivers: ["apple"],
          textureDrivers: ["mash"],
          structureDrivers: ["flour"],
          highImpactOpportunities: ["cut fat"],
          wouldNotChange: [{ item: "flour", reason: "Structure" }],
          tasteImpact: "significant",
          assumptions: [],
        },
      }),
    );
    expect(result.pass).toBe(false);
    expect(result.deductions.map((item) => item.rule)).toEqual(
      expect.arrayContaining(["must-preserve", "must-not-suggest"]),
    );
  });

  it("fails carbonara with skim milk", () => {
    const carbonara = cases.find((item) => item.id === "carbonara-no-skim-cream")!;
    const result = scoreConversion(
      carbonara,
      baseOutput({
        thriveVersion: {
          title: "Light carbonara",
          description: "Not carbonara.",
          servings: 4,
          prepMinutes: 10,
          cookMinutes: 15,
          ingredients: [
            {
              rawText: "1 cup skim milk",
              name: "skim milk",
              quantity: 1,
              unit: "cup",
              preparation: null,
              assumptionNote: null,
            },
          ],
          instructions: ["Boil pasta and add milk."],
        },
      }),
    );
    expect(result.pass).toBe(false);
    expect(result.deductions.some((item) => item.rule === "must-not-suggest")).toBe(true);
  });

  it("fails disease-treatment language", () => {
    const biscuitCase = cases.find((item) => item.id === "buttermilk-biscuits-keep-butter")!;
    const result = scoreConversion(
      biscuitCase,
      baseOutput({
        changes: [
          {
            original: "butter",
            suggested: "less butter",
            nutritionReason: "This will cure heart disease.",
            flavorEffect: "Milder.",
            textureEffect: "Slightly less rich.",
          },
        ],
      }),
    );
    expect(result.pass).toBe(false);
    expect(result.deductions.some((item) => item.rule === "medical-claim")).toBe(true);
  });

  it("fails a Thrive Version that copies the original recipe unchanged", () => {
    const chili = cases.find((item) => item.id === "chili-no-invented-ingredients")!;
    const result = scoreConversion(
      chili,
      baseOutput({
        thriveVersion: {
          title: chili.original.title,
          description: "Copied.",
          servings: 4,
          prepMinutes: 15,
          cookMinutes: 40,
          ingredients: chili.original.ingredients.map((rawText) => ({
            rawText,
            name: rawText,
            quantity: null,
            unit: null,
            preparation: null,
            assumptionNote: null,
          })),
          instructions: chili.original.instructions,
        },
        changes: [
          {
            original: "The original pot",
            suggested: "Leave it",
            nutritionReason: "No change.",
            flavorEffect: "The same.",
            textureEffect: "The same.",
          },
        ],
      }),
    );
    expect(result.pass).toBe(false);
    expect(result.deductions.some((item) => item.rule === "no-rewrite")).toBe(true);
  });
});

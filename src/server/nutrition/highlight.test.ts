import { describe, expect, it } from "vitest";
import { nutritionCardHighlight } from "./highlight";
import { emptyNutrients, type NutritionComparison } from "./schema";

function comparison(original: Partial<ReturnType<typeof emptyNutrients>>, thrive: Partial<ReturnType<typeof emptyNutrients>>): NutritionComparison {
  return {
    source: "usda_fdc_local",
    sourceLabel: "USDA local catalog",
    original: {
      servings: 6,
      totals: { ...emptyNutrients(), ...original },
      perServing: { ...emptyNutrients(), ...original },
      confidence: "high",
      mappedCount: 3,
      unmappedCount: 0,
      assumedCount: 0,
      ingredients: [],
      notes: [],
    },
    thrive: {
      servings: 6,
      totals: { ...emptyNutrients(), ...thrive },
      perServing: { ...emptyNutrients(), ...thrive },
      confidence: "high",
      mappedCount: 3,
      unmappedCount: 0,
      assumedCount: 0,
      ingredients: [],
      notes: [],
    },
    deltaPerServing: emptyNutrients(),
  };
}

describe("nutrition card highlight", () => {
  it("shows a calorie drop as fewer calories and extra protein as a gain", () => {
    const highlight = nutritionCardHighlight(
      comparison({ calories: 950, proteinG: 28, fiberG: 6 }, { calories: 750, proteinG: 36, fiberG: 9 }),
    );
    expect(highlight?.calories).toBe("950 → 750 cal");
    expect(highlight?.improvement).toBe("21% fewer calories");
  });

  it("does not celebrate a protein drop", () => {
    const highlight = nutritionCardHighlight(
      comparison({ calories: 500, proteinG: 40, fiberG: 4 }, { calories: 510, proteinG: 22, fiberG: 4 }),
    );
    expect(highlight?.calories).toBe("500 → 510 cal");
    expect(highlight?.improvement).toBeNull();
  });

  it("does not treat an unmatched original as 0 calories", () => {
    const highlight = nutritionCardHighlight({
      ...comparison({ calories: 0, proteinG: 0, fiberG: 0 }, { calories: 410, proteinG: 28, fiberG: 9 }),
      original: {
        ...comparison({ calories: 0 }, { calories: 410 }).original,
        mappedCount: 0,
        unmappedCount: 4,
        assumedCount: 0,
        confidence: "low",
      },
    });
    expect(highlight?.calories).toBe("410 cal");
    expect(highlight?.improvement).toBeNull();
  });
});

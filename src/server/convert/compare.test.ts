import { describe, expect, it } from "vitest";
import { emptyNutrients } from "../nutrition/schema";
import { compareHref } from "@/lib/compare-href";
import {
  compareThriveNutrition,
  linePresence,
  pairThriveJobs,
} from "./compare";
import type { ConversionJob } from "./schema";

function job(partial: Partial<ConversionJob> & Pick<ConversionJob, "id" | "draftId" | "createdAt">): ConversionJob {
  return {
    recipe: {
      title: "Weeknight chili",
      description: null,
      servings: 6,
      prepMinutes: null,
      cookMinutes: null,
      cuisine: null,
      category: null,
      ingredients: [
        {
          rawText: "1 onion",
          name: "onion",
          quantity: 1,
          unit: null,
          preparation: null,
        },
      ],
      instructions: ["Simmer."],
      sourceUrl: null,
      sourceSite: null,
      sourceAuthor: null,
      originalTitle: "Weeknight chili",
      extractor: "paste",
      confidence: "high",
      warnings: [],
      assumptions: [],
    },
    goals: ["healthier_overall"],
    dietary: [],
    preference: "balanced",
    status: "complete",
    statusLabel: "Ready",
    provider: "mock",
    model: "culinary-mock-v1",
    promptVersion: "thrive-conversion-v1",
    output: {
      analysis: {
        flavorDrivers: ["chili powder"],
        textureDrivers: ["beans"],
        structureDrivers: ["simmer"],
        highImpactOpportunities: ["beans"],
        wouldNotChange: [{ item: "chili powder", reason: "It is the dish." }],
        tasteImpact: "minimal",
        assumptions: [],
      },
      thriveVersion: {
        title: "Weeknight chili, thrived",
        description: "Still chili.",
        servings: 6,
        prepMinutes: 15,
        cookMinutes: 40,
        ingredients: [
          {
            rawText: "1 pound ground turkey",
            name: "ground turkey",
            quantity: 1,
            unit: "pound",
            preparation: null,
            assumptionNote: null,
          },
        ],
        instructions: ["Simmer."],
      },
      changes: [
        {
          original: "ground beef",
          suggested: "ground turkey",
          nutritionReason: "Leaner.",
          flavorEffect: "Milder.",
          textureEffect: "Softer.",
        },
      ],
    },
    nutrition: {
      source: "usda_fdc_local",
      sourceLabel: "USDA FoodData Central (local catalog)",
      original: {
        servings: 6,
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
        servings: 6,
        totals: { ...emptyNutrients(), calories: 2400, proteinG: 180 },
        perServing: { ...emptyNutrients(), calories: 400, proteinG: 30 },
        confidence: "high",
        mappedCount: 1,
        unmappedCount: 0,
        assumedCount: 0,
        ingredients: [],
        notes: [],
      },
      deltaPerServing: { ...emptyNutrients(), calories: -40, proteinG: 4 },
    },
    errorCode: null,
    errorMessage: null,
    inputTokens: null,
    outputTokens: null,
    latencyMs: null,
    guestId: null,
    userId: "cook-1",
    updatedAt: partial.createdAt,
    ...partial,
  };
}

describe("compare Thrive Versions", () => {
  it("pairs complete versions of the same original in one kitchen", () => {
    const a = job({ id: "a", draftId: "chili", createdAt: "2026-08-25T10:00:00.000Z" });
    const b = job({
      id: "b",
      draftId: "chili",
      createdAt: "2026-08-25T12:00:00.000Z",
      goals: ["lower_calories"],
    });
    expect(pairThriveJobs(a, b)).toEqual({ ok: true });
  });

  it("refuses a failed run, a different original, another kitchen, or the same job", () => {
    const a = job({ id: "a", draftId: "chili", createdAt: "2026-08-25T10:00:00.000Z" });
    expect(pairThriveJobs(a, a).ok).toBe(false);
    expect(
      pairThriveJobs(
        a,
        job({
          id: "fail",
          draftId: "chili",
          createdAt: "2026-08-25T11:00:00.000Z",
          status: "failed",
          output: null,
        }),
      ),
    ).toEqual({ ok: false, reason: "not_complete" });
    expect(
      pairThriveJobs(a, job({ id: "cake", draftId: "cake", createdAt: "2026-08-25T11:00:00.000Z" })),
    ).toEqual({ ok: false, reason: "different_original" });
    expect(
      pairThriveJobs(
        a,
        job({ id: "theirs", draftId: "chili", createdAt: "2026-08-25T11:00:00.000Z", userId: "cook-2" }),
      ),
    ).toEqual({ ok: false, reason: "different_kitchen" });
  });

  it("subtracts USDA thrive estimates right minus left", () => {
    const left = job({ id: "a", draftId: "chili", createdAt: "2026-08-25T10:00:00.000Z" });
    const right = job({
      id: "b",
      draftId: "chili",
      createdAt: "2026-08-25T12:00:00.000Z",
      nutrition: {
        ...left.nutrition!,
        thrive: {
          ...left.nutrition!.thrive,
          perServing: { ...emptyNutrients(), calories: 320, proteinG: 34 },
        },
      },
    });
    const compared = compareThriveNutrition(left, right);
    expect(compared.perServing).toBe(true);
    expect(compared.delta?.calories).toBe(-80);
    expect(compared.delta?.proteinG).toBe(4);
  });

  it("orders compare URLs by version number", () => {
    expect(compareHref("b", "a", 2, 1)).toBe("/kitchen/compare?left=a&right=b");
  });

  it("splits ingredient lines that only one version kept", () => {
    const presence = linePresence(
      ["1 pound ground turkey", "1 onion"],
      ["1 pound ground turkey", "1 can black beans"],
    );
    expect(presence.leftOnly).toEqual(["1 onion"]);
    expect(presence.rightOnly).toEqual(["1 can black beans"]);
    expect(presence.both).toEqual(["1 pound ground turkey"]);
  });
});

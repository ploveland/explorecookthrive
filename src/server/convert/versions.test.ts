import { describe, expect, it } from "vitest";
import type { ConversionJob } from "./schema";
import { groupJobsByOriginal, sameKitchen, versionNumberFor } from "./versions";

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
    output: null,
    nutrition: null,
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

describe("thrive versions of one original", () => {
  it("groups by draft and numbers complete versions oldest first", () => {
    const chiliA = job({
      id: "a",
      draftId: "chili",
      createdAt: "2026-08-25T10:00:00.000Z",
    });
    const chiliB = job({
      id: "b",
      draftId: "chili",
      createdAt: "2026-08-25T12:00:00.000Z",
      goals: ["more_fiber"],
    });
    const cake = job({
      id: "c",
      draftId: "cake",
      createdAt: "2026-08-25T11:00:00.000Z",
      recipe: {
        ...chiliA.recipe,
        title: "Layer cake",
        originalTitle: "Layer cake",
      },
    });
    const grouped = groupJobsByOriginal([chiliB, cake, chiliA]);
    expect(grouped.map((group) => group.draftId)).toEqual(["chili", "cake"]);
    expect(grouped[0]?.jobs.map((item) => item.id)).toEqual(["b", "a"]);
    expect(grouped[0]?.completeCount).toBe(2);
    expect(versionNumberFor(grouped[0]!.jobs, "a")).toBe(1);
    expect(versionNumberFor(grouped[0]!.jobs, "b")).toBe(2);
  });

  it("does not number a failed run", () => {
    const ok = job({ id: "ok", draftId: "chili", createdAt: "2026-08-25T10:00:00.000Z" });
    const failed = job({
      id: "no",
      draftId: "chili",
      createdAt: "2026-08-25T11:00:00.000Z",
      status: "failed",
      statusLabel: "Could not finish",
    });
    expect(versionNumberFor([failed, ok], "ok")).toBe(1);
    expect(versionNumberFor([failed, ok], "no")).toBeNull();
  });

  it("keeps kitchens apart even when draft ids match", () => {
    const mine = job({ id: "mine", draftId: "chili", createdAt: "2026-08-25T10:00:00.000Z" });
    const theirs = job({
      id: "theirs",
      draftId: "chili",
      createdAt: "2026-08-25T11:00:00.000Z",
      userId: "cook-2",
    });
    expect(sameKitchen(mine, theirs)).toBe(false);
    expect(sameKitchen(mine, { ...mine, id: "also-mine" })).toBe(true);
  });
});

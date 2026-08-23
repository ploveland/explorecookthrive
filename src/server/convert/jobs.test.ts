import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { saveDraft } from "../drafts/store";
import { createJob, getJob, processJob, JobError } from "./jobs";

const sampleRecipe = {
  title: "Weeknight chili",
  description: "A pot of chili.",
  servings: 6,
  prepMinutes: 15,
  cookMinutes: 40,
  cuisine: null,
  category: null,
  ingredients: [
    {
      rawText: "1 pound ground beef",
      name: "ground beef",
      quantity: 1,
      unit: "pound",
      preparation: null,
    },
    {
      rawText: "1 onion",
      name: "onion",
      quantity: 1,
      unit: null,
      preparation: null,
    },
    {
      rawText: "2 tablespoons chili powder",
      name: "chili powder",
      quantity: 2,
      unit: "tablespoon",
      preparation: null,
    },
    {
      rawText: "1 can kidney beans",
      name: "kidney beans",
      quantity: 1,
      unit: "can",
      preparation: null,
    },
  ],
  instructions: ["Brown beef and onion, add spices and beans, simmer."],
  sourceUrl: null,
  sourceSite: null,
  sourceAuthor: null,
  originalTitle: null,
  extractor: "paste" as const,
  confidence: "high" as const,
  warnings: [],
  assumptions: [],
};

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "jobs"), { recursive: true, force: true });
});

describe("conversion jobs", () => {
  it("refuses a missing draft", async () => {
    await expect(
      createJob({
        draftId: "missing",
        goals: ["healthier_overall"],
        preference: "balanced",
        dietary: [],
      }),
    ).rejects.toBeInstanceOf(JobError);
  });

  it("runs a mock conversion through to a private result", async () => {
    process.env.CONVERT_STAGE_DELAY_MS = "0";
    delete process.env.OPENAI_API_KEY;
    const draft = await saveDraft(sampleRecipe);
    const job = await createJob({
      draftId: draft.id,
      goals: ["higher_protein", "more_fiber"],
      preference: "balanced",
      dietary: [],
    });
    expect(job.status).toBe("queued");
    expect(job.provider).toBe("mock");

    const done = await processJob(job.id);
    expect(done?.status).toBe("complete");
    expect(done?.output?.thriveVersion.ingredients.length).toBeGreaterThan(0);
    expect(done?.output?.changes.length).toBeGreaterThan(0);
    expect(JSON.stringify(done?.output)).not.toMatch(/"nutrition"\s*:/);

    const stored = await getJob(job.id);
    expect(stored?.status).toBe("complete");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { saveDraft } from "../drafts/store";
import { createJob, ensureDraftFromJob, getJob, listRelatedJobs, processJob, JobError } from "./jobs";
import { newStorageId } from "../fs/safe-path";

const GUEST = "11111111-1111-4111-8111-111111111111";
import { versionNumberFor } from "./versions";

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
  await rm(path.join(process.cwd(), ".data", "drafts"), { recursive: true, force: true });
});

describe("conversion jobs", () => {
  it("refuses a missing draft", async () => {
    await expect(
      createJob({
        draftId: newStorageId(),
        goals: ["healthier_overall"],
        preference: "balanced",
        dietary: [],
        guestId: GUEST,
      }),
    ).rejects.toBeInstanceOf(JobError);
  });

  it("refuses to restore a conversion that is not there", async () => {
    await expect(ensureDraftFromJob(newStorageId())).rejects.toMatchObject({ code: "job_not_found" });
  });

  it("runs a mock conversion through to a private result", async () => {
    process.env.CONVERT_STAGE_DELAY_MS = "0";
    delete process.env.OPENAI_API_KEY;
    const draft = await saveDraft(sampleRecipe, { guestId: GUEST });
    const job = await createJob({
      draftId: draft.id,
      goals: ["higher_protein", "more_fiber"],
      preference: "balanced",
      dietary: [],
      guestId: GUEST,
    });
    expect(job.status).toBe("queued");
    expect(job.provider).toBe("mock");

    const done = await processJob(job.id);
    expect(done?.status).toBe("complete");
    expect(done?.output?.thriveVersion.ingredients.length).toBeGreaterThan(0);
    expect(done?.output?.changes.length).toBeGreaterThan(0);
    expect(JSON.stringify(done?.output)).not.toMatch(/"nutrition"\s*:/);
    expect(done?.nutrition).not.toBeNull();
    expect(done?.nutrition?.original.totals.calories).toBeGreaterThan(0);
    expect(done?.nutrition?.thrive.totals.fiberG).toBeGreaterThanOrEqual(
      done?.nutrition?.original.totals.fiberG ?? 0,
    );

    const stored = await getJob(job.id);
    expect(stored?.status).toBe("complete");
  });

  it("restores a missing draft so the cook can thrive again with new goals", async () => {
    process.env.CONVERT_STAGE_DELAY_MS = "0";
    delete process.env.OPENAI_API_KEY;
    const draft = await saveDraft(sampleRecipe, { guestId: GUEST });
    const first = await createJob({
      draftId: draft.id,
      goals: ["higher_protein", "more_fiber"],
      preference: "balanced",
      dietary: [],
      guestId: GUEST,
    });
    await processJob(first.id);
    await rm(path.join(process.cwd(), ".data", "drafts", `${draft.id}.json`), { force: true });

    const restored = await ensureDraftFromJob(first.id);
    expect(restored.draft.id).toBe(first.draftId);
    expect(restored.draft.recipe.title).toBe("Weeknight chili");
    expect(restored.job.goals).toEqual(["higher_protein", "more_fiber"]);

    const second = await createJob({
      draftId: restored.draft.id,
      goals: ["lower_calories"],
      preference: "preserve",
      dietary: ["gluten_free"],
      guestId: GUEST,
    });
    expect(second.id).not.toBe(first.id);
    expect(second.goals).toEqual(["lower_calories"]);
    expect(second.preference).toBe("preserve");
    expect(second.dietary).toEqual(["gluten_free"]);

    const done = await processJob(second.id);
    expect(done?.status).toBe("complete");
    expect(done?.output?.thriveVersion.ingredients.length).toBeGreaterThan(0);

    const related = await listRelatedJobs(done!);
    expect(related.map((item) => item.id).sort()).toEqual([first.id, second.id].sort());
    expect(versionNumberFor(related, first.id)).toBe(1);
    expect(versionNumberFor(related, second.id)).toBe(2);
  });
});

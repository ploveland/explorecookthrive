import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { saveDraft } from "../drafts/store";
import { createJob, processJob } from "../convert/jobs";
import { assignLibraryTags } from "./tags";
import { getPublishedByJobId, listPublished, publishFromJob, LibraryError } from "./store";

const sampleRecipe = {
  title: "Weeknight chili",
  description: "A pot of chili.",
  servings: 6,
  prepMinutes: 15,
  cookMinutes: 40,
  cuisine: "American",
  category: "dinner",
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
      rawText: "1 can kidney beans",
      name: "kidney beans",
      quantity: 1,
      unit: "can",
      preparation: null,
    },
  ],
  instructions: ["Brown beef and onion, add beans, simmer."],
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
  await rm(path.join(process.cwd(), ".data", "library"), { recursive: true, force: true });
});

describe("library tags", () => {
  it("maps goals, cuisine, and a weeknight chili to browse tags", () => {
    const tags = assignLibraryTags({
      title: "Weeknight chili, thrived",
      originalTitle: "Weeknight chili",
      description: "A pot of chili that keeps the beef.",
      cuisine: "American",
      category: "dinner",
      instructions: ["Brown the beef. Simmer 30 minutes."],
      prepMinutes: 15,
      cookMinutes: 30,
      goals: ["higher_protein", "more_fiber"],
      dietary: ["gluten_free"],
    });
    expect(tags).toEqual(
      expect.arrayContaining([
        "higher-protein",
        "more-fiber",
        "gluten-free",
        "american",
        "dinner",
        "weeknight",
        "comfort-food",
        "stovetop",
      ]),
    );
  });

  it("tags biscuits as better baking and comfort food", () => {
    const tags = assignLibraryTags({
      title: "Buttermilk biscuits, thrived",
      originalTitle: "Buttermilk biscuits",
      description: "Flaky biscuits.",
      cuisine: "Southern",
      category: "breakfast",
      instructions: ["Cut butter into flour. Bake until risen."],
      prepMinutes: 20,
      cookMinutes: 15,
      goals: ["lower_calories"],
      dietary: [],
    });
    expect(tags).toEqual(
      expect.arrayContaining(["better-baking", "comfort-food", "breakfast", "southern", "bake", "weeknight"]),
    );
  });
});

describe("library publish", () => {
  it("publishes a completed job once and lists it for search", async () => {
    process.env.CONVERT_STAGE_DELAY_MS = "0";
    delete process.env.OPENAI_API_KEY;
    const draft = await saveDraft(sampleRecipe);
    const job = await createJob({
      draftId: draft.id,
      goals: ["higher_protein", "more_fiber"],
      preference: "balanced",
      dietary: [],
    });
    const done = await processJob(job.id);
    expect(done?.status).toBe("complete");

    const published = await publishFromJob(done!);
    expect(published.slug).toMatch(/chili/);
    expect(published.ingredients.length).toBeGreaterThan(0);
    expect(published.jobId).toBe(done!.id);
    expect(published.originalTitle).toBe("Weeknight chili");

    const again = await publishFromJob(done!);
    expect(again.id).toBe(published.id);

    const found = await getPublishedByJobId(done!.id);
    expect(found?.slug).toBe(published.slug);

    const listed = await listPublished({ query: "chili" });
    expect(listed.map((item) => item.id)).toContain(published.id);

    const fiber = await listPublished({ tag: "more-fiber" });
    expect(fiber.map((item) => item.id)).toContain(published.id);

    expect(published).not.toHaveProperty("originalIngredients");
    expect(published).not.toHaveProperty("originalInstructions");
    expect(published.instructions).toEqual(done!.output!.thriveVersion.instructions);
  });

  it("refuses an unfinished job", async () => {
    process.env.CONVERT_STAGE_DELAY_MS = "0";
    const draft = await saveDraft(sampleRecipe);
    const job = await createJob({
      draftId: draft.id,
      goals: ["healthier_overall"],
      preference: "balanced",
      dietary: [],
    });
    await expect(publishFromJob(job)).rejects.toBeInstanceOf(LibraryError);
  });
});

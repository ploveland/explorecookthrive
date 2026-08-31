import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { saveDraft } from "../drafts/store";
import { createJob, processJob } from "../convert/jobs";
import { toggleFavorite, FavoriteError } from "../accounts/favorites";
import { addToCollection, createCollection, CollectionError } from "../accounts/collections";
import {
  getVisibleBySlug,
  publishFromJob,
  setRecipeVisibility,
  LibraryError,
} from "./store";

const GUEST_A = "11111111-1111-4111-8111-111111111111";
const GUEST_B = "22222222-2222-4222-8222-222222222222";
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

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
  ],
  instructions: ["Brown beef and simmer."],
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
  await rm(path.join(process.cwd(), ".data", "favorites"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "collections"), { recursive: true, force: true });
});

async function completeJob(guestId: string) {
  process.env.CONVERT_STAGE_DELAY_MS = "0";
  delete process.env.OPENAI_API_KEY;
  const draft = await saveDraft(sampleRecipe, { guestId, userId: guestId === GUEST_A ? USER_A : USER_B });
  const job = await createJob({
    draftId: draft.id,
    goals: ["healthier_overall"],
    preference: "balanced",
    dietary: [],
    guestId,
    userId: guestId === GUEST_A ? USER_A : USER_B,
  });
  const done = await processJob(job.id);
  if (!done || done.status !== "complete") throw new Error("job did not complete");
  return done;
}

describe("library access control", () => {
  it("lets the owner publish and keeps user B off a private recipe", async () => {
    const jobA = await completeJob(GUEST_A);
    const published = await publishFromJob(jobA, { ownerId: USER_A, ownerName: "Sam" });
    await setRecipeVisibility(published.slug, USER_A, "private");

    expect(await getVisibleBySlug(published.slug, USER_A)).not.toBeNull();
    expect(await getVisibleBySlug(published.slug, USER_B)).toBeNull();
    expect(await getVisibleBySlug(published.slug, null)).toBeNull();

    await expect(toggleFavorite(USER_B, published.slug)).rejects.toBeInstanceOf(FavoriteError);
    const collection = await createCollection(USER_B, "Stolen pots");
    await expect(addToCollection(USER_B, collection.id, published.slug)).rejects.toBeInstanceOf(
      CollectionError,
    );
  });

  it("keeps public recipes visible and favoriteable", async () => {
    const jobA = await completeJob(GUEST_A);
    const published = await publishFromJob(jobA, { ownerId: USER_A, ownerName: "Sam" });
    expect(await getVisibleBySlug(published.slug, null)).not.toBeNull();
    expect(await toggleFavorite(USER_B, published.slug)).toEqual({ favorited: true });
  });

  it("refuses to attach another owner's published row to a later publisher", async () => {
    const jobA = await completeJob(GUEST_A);
    await publishFromJob(jobA, { ownerId: USER_A, ownerName: "Sam" });
    await expect(publishFromJob(jobA, { ownerId: USER_B, ownerName: "Pat" })).rejects.toMatchObject({
      code: "not_owner",
    });
    expect(LibraryError).toBeDefined();
  });
});

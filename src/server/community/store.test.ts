import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { RatingError, getRatingSummary, getUserRating, upsertRating } from "./store";

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "ratings"), { recursive: true, force: true });
});

describe("community ratings store", () => {
  it("upserts one rating per cook and summarizes", async () => {
    await upsertRating({
      slug: "weeknight-chili",
      userId: "cook-1",
      ownerId: "owner",
      visibility: "public",
      taste: 5,
      texture: 4,
      wouldMakeAgain: true,
    });
    const updated = await upsertRating({
      slug: "weeknight-chili",
      userId: "cook-1",
      ownerId: "owner",
      visibility: "public",
      taste: 4,
      texture: 5,
      wouldMakeAgain: true,
    });
    expect(updated.summary.count).toBe(1);
    expect(updated.rating.taste).toBe(4);
    expect((await getUserRating("weeknight-chili", "cook-1"))?.texture).toBe(5);
    expect((await getRatingSummary("weeknight-chili")).tasteAverage).toBe(4);
  });

  it("refuses the publisher and private recipes", async () => {
    await expect(
      upsertRating({
        slug: "weeknight-chili",
        userId: "owner",
        ownerId: "owner",
        visibility: "public",
        taste: 5,
        texture: 5,
        wouldMakeAgain: true,
      }),
    ).rejects.toMatchObject({ code: "owner_cannot_rate" });

    await expect(
      upsertRating({
        slug: "secret-chili",
        userId: "cook-1",
        ownerId: "owner",
        visibility: "private",
        taste: 5,
        texture: 5,
        wouldMakeAgain: true,
      }),
    ).rejects.toBeInstanceOf(RatingError);
  });
});

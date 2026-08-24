import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { createUser } from "../accounts/users";
import { RatingError, getRatingSummary, getUserRating, listPublicReviews, upsertRating } from "./store";

const scores = {
  taste: 5,
  texture: 4,
  similarity: 5,
  ease: 4,
  wouldMakeAgain: true,
} as const;

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "ratings"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "users"), { recursive: true, force: true });
});

describe("community ratings store", () => {
  it("upserts one rating per cook and summarizes", async () => {
    await upsertRating({
      slug: "weeknight-chili",
      userId: "cook-1",
      ownerId: "owner",
      visibility: "public",
      ...scores,
    });
    const updated = await upsertRating({
      slug: "weeknight-chili",
      userId: "cook-1",
      ownerId: "owner",
      visibility: "public",
      taste: 4,
      texture: 5,
      similarity: 4,
      ease: 5,
      wouldMakeAgain: true,
      comment: "  Beans still belonged.  ",
    });
    expect(updated.summary.count).toBe(1);
    expect(updated.rating.taste).toBe(4);
    expect(updated.rating.comment).toBe("Beans still belonged.");
    expect((await getUserRating("weeknight-chili", "cook-1"))?.texture).toBe(5);
    expect((await getRatingSummary("weeknight-chili")).tasteAverage).toBe(4);
  });

  it("lists named cook notes and hides empty comments", async () => {
    const cook = await createUser({
      email: "pat@example.com",
      name: "Pat Baker",
      password: "cornbread1",
    });
    await upsertRating({
      slug: "weeknight-chili",
      userId: cook.id,
      ownerId: "owner",
      visibility: "public",
      ...scores,
      comment: "Still tasted like a weeknight pot.",
    });
    await upsertRating({
      slug: "weeknight-chili",
      userId: "quiet-cook",
      ownerId: "owner",
      visibility: "public",
      ...scores,
      comment: "   ",
    });
    const reviews = await listPublicReviews("weeknight-chili");
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.cookName).toBe("Pat");
    expect(reviews[0]?.comment).toBe("Still tasted like a weeknight pot.");
  });

  it("refuses the publisher and private recipes", async () => {
    await expect(
      upsertRating({
        slug: "weeknight-chili",
        userId: "owner",
        ownerId: "owner",
        visibility: "public",
        ...scores,
      }),
    ).rejects.toMatchObject({ code: "owner_cannot_rate" });

    await expect(
      upsertRating({
        slug: "secret-chili",
        userId: "cook-1",
        ownerId: "owner",
        visibility: "private",
        ...scores,
      }),
    ).rejects.toBeInstanceOf(RatingError);
  });
});

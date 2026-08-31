import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { createUser } from "../accounts/users";
import { getRatingSummary, getUserRating, listPublicReviews, upsertRating } from "./store";
import { InvalidStorageIdError } from "../fs/safe-path";

const COOK_1 = "11111111-1111-4111-8111-111111111111";
const COOK_QUIET = "22222222-2222-4222-8222-222222222222";
const OWNER = "33333333-3333-4333-8333-333333333333";
const scores = {
  taste: 5,
  texture: 4,
  similarity: 5,
  ease: 4,
  wouldMakeAgain: true,
} as const;

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "ratings"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "rating-writes"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "users"), { recursive: true, force: true });
});

describe("community ratings store", () => {
  it("upserts one rating per cook and summarizes", async () => {
    await upsertRating({
      slug: "weeknight-chili",
      userId: COOK_1,
      ownerId: OWNER,
      visibility: "public",
      ...scores,
    });
    const updated = await upsertRating({
      slug: "weeknight-chili",
      userId: COOK_1,
      ownerId: OWNER,
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
    expect((await getUserRating("weeknight-chili", COOK_1))?.texture).toBe(5);
    expect((await getRatingSummary("weeknight-chili")).tasteAverage).toBe(4);
  });

  it("rejects a traversal slug instead of writing a ratings file outside the store", async () => {
    await expect(
      upsertRating({
        slug: "../users",
        userId: COOK_1,
        ownerId: OWNER,
        visibility: "public",
        ...scores,
      }),
    ).rejects.toBeInstanceOf(InvalidStorageIdError);
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
      ownerId: OWNER,
      visibility: "public",
      ...scores,
      comment: "Still tasted like a weeknight pot.",
    });
    await upsertRating({
      slug: "weeknight-chili",
      userId: COOK_QUIET,
      ownerId: OWNER,
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
        userId: OWNER,
        ownerId: OWNER,
        visibility: "public",
        ...scores,
      }),
    ).rejects.toMatchObject({ code: "owner_cannot_rate" });

    await expect(
      upsertRating({
        slug: "secret-chili",
        userId: COOK_1,
        ownerId: OWNER,
        visibility: "private",
        ...scores,
      }),
    ).rejects.toMatchObject({ code: "not_rateable" });

    await expect(
      upsertRating({
        slug: "unlisted-chili",
        userId: COOK_1,
        ownerId: OWNER,
        visibility: "unlisted",
        ...scores,
      }),
    ).rejects.toMatchObject({ code: "not_rateable" });
  });

  it("refuses a cook note with a link", async () => {
    await expect(
      upsertRating({
        slug: "weeknight-chili",
        userId: COOK_1,
        ownerId: OWNER,
        visibility: "public",
        ...scores,
        comment: "Read more at https://spam.example/chili",
      }),
    ).rejects.toMatchObject({ code: "blocked_comment" });
  });
});

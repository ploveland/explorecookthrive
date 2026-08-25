import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { RATING_WRITES_PER_HOUR, canWriteRating, recordRatingWrite } from "./rate-limit";

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "rating-writes"), { recursive: true, force: true });
});

describe("rating write budget", () => {
  it("allows a handful of writes then stops for the hour", async () => {
    const userId = "cook-1";
    const start = Date.now();
    for (let i = 0; i < RATING_WRITES_PER_HOUR; i += 1) {
      expect(await canWriteRating(userId, start)).toBe(true);
      await recordRatingWrite(userId, start + i);
    }
    expect(await canWriteRating(userId, start + RATING_WRITES_PER_HOUR)).toBe(false);
  });
});

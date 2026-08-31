import { z } from "zod";
import { dataDir, readConfinedJson, writeConfinedJson } from "../fs/safe-path";

export const RATING_WRITES_PER_HOUR = 8;
export const RATING_WRITES_PER_DAY = 20;

const DIR = dataDir("rating-writes");
const recordSchema = z.object({
  at: z.array(z.number()),
});

async function readStamps(userId: string): Promise<number[]> {
  try {
    const raw = await readConfinedJson(DIR, userId);
    return recordSchema.parse(JSON.parse(raw)).at;
  } catch {
    return [];
  }
}

export async function canWriteRating(userId: string, now = Date.now()): Promise<boolean> {
  const hour = now - 60 * 60 * 1000;
  const day = now - 24 * 60 * 60 * 1000;
  const at = (await readStamps(userId)).filter((stamp) => stamp >= day);
  const lastHour = at.filter((stamp) => stamp >= hour).length;
  return lastHour < RATING_WRITES_PER_HOUR && at.length < RATING_WRITES_PER_DAY;
}

export async function recordRatingWrite(userId: string, now = Date.now()) {
  const day = now - 24 * 60 * 60 * 1000;
  const at = [...(await readStamps(userId)).filter((stamp) => stamp >= day), now];
  await writeConfinedJson(DIR, userId, JSON.stringify({ at }, null, 2));
}

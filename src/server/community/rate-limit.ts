import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const RATING_WRITES_PER_HOUR = 8;
export const RATING_WRITES_PER_DAY = 20;

const DIR = path.join(process.cwd(), ".data", "rating-writes");
const recordSchema = z.object({
  at: z.array(z.number()),
});

function fileFor(userId: string) {
  return path.join(DIR, `${userId}.json`);
}

async function readStamps(userId: string): Promise<number[]> {
  try {
    const raw = await readFile(fileFor(userId), "utf8");
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
  await mkdir(DIR, { recursive: true });
  await writeFile(fileFor(userId), JSON.stringify({ at }, null, 2), "utf8");
}

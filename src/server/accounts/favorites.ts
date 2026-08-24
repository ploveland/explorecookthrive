import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DIR = path.join(process.cwd(), ".data", "favorites");

const favoriteListSchema = z.object({
  userId: z.string(),
  slugs: z.array(z.string()),
});

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

function fileFor(userId: string) {
  return path.join(DIR, `${userId}.json`);
}

async function readList(userId: string): Promise<string[]> {
  try {
    const raw = await readFile(fileFor(userId), "utf8");
    return favoriteListSchema.parse(JSON.parse(raw)).slugs;
  } catch {
    return [];
  }
}

async function writeList(userId: string, slugs: string[]) {
  await ensureDir();
  await writeFile(
    fileFor(userId),
    JSON.stringify({ userId, slugs }, null, 2),
    "utf8",
  );
  return slugs;
}

export async function listFavoriteSlugs(userId: string): Promise<string[]> {
  return readList(userId);
}

export async function isFavorite(userId: string, slug: string): Promise<boolean> {
  const slugs = await readList(userId);
  return slugs.includes(slug);
}

export async function toggleFavorite(userId: string, slug: string): Promise<{ favorited: boolean }> {
  const slugs = await readList(userId);
  if (slugs.includes(slug)) {
    await writeList(
      userId,
      slugs.filter((item) => item !== slug),
    );
    return { favorited: false };
  }
  await writeList(userId, [slug, ...slugs]);
  return { favorited: true };
}

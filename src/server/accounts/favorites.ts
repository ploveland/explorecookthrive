import { z } from "zod";
import { dataDir, parsePublicSlug, readConfinedJson, writeConfinedJson } from "../fs/safe-path";

const DIR = dataDir("favorites");

const favoriteListSchema = z.object({
  userId: z.string(),
  slugs: z.array(z.string()),
});

async function readList(userId: string): Promise<string[]> {
  try {
    const raw = await readConfinedJson(DIR, userId);
    return favoriteListSchema.parse(JSON.parse(raw)).slugs;
  } catch {
    return [];
  }
}

async function writeList(userId: string, slugs: string[]) {
  await writeConfinedJson(
    DIR,
    userId,
    JSON.stringify({ userId, slugs }, null, 2),
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
  const safeSlug = parsePublicSlug(slug);
  const slugs = await readList(userId);
  if (slugs.includes(safeSlug)) {
    await writeList(
      userId,
      slugs.filter((item) => item !== safeSlug),
    );
    return { favorited: false };
  }
  await writeList(userId, [safeSlug, ...slugs]);
  return { favorited: true };
}

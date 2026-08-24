import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DIR = path.join(process.cwd(), ".data", "collections");

export const collectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  recipeSlugs: z.array(z.string()),
  createdAt: z.string(),
});

export type KitchenCollection = z.infer<typeof collectionSchema>;

export class CollectionError extends Error {
  constructor(
    public readonly code: "not_found" | "invalid_input",
    message: string,
  ) {
    super(message);
    this.name = "CollectionError";
  }
}

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

function fileFor(id: string) {
  return path.join(DIR, `${id}.json`);
}

function slugify(name: string, id: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "collection";
  return `${base}-${id.slice(0, 6)}`;
}

async function readAll(): Promise<KitchenCollection[]> {
  try {
    const names = await readdir(DIR);
    const collections = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const raw = await readFile(path.join(DIR, name), "utf8");
          return collectionSchema.parse(JSON.parse(raw));
        }),
    );
    return collections.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function listCollections(userId: string): Promise<KitchenCollection[]> {
  const collections = await readAll();
  return collections.filter((item) => item.userId === userId);
}

export async function getCollection(id: string): Promise<KitchenCollection | null> {
  try {
    const raw = await readFile(fileFor(id), "utf8");
    return collectionSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function getCollectionForUser(
  userId: string,
  slug: string,
): Promise<KitchenCollection | null> {
  const collections = await listCollections(userId);
  return collections.find((item) => item.slug === slug || item.id === slug) ?? null;
}

export async function createCollection(userId: string, name: string): Promise<KitchenCollection> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new CollectionError("invalid_input", "Name the collection something you will recognize.");
  }
  const id = randomUUID();
  const collection = collectionSchema.parse({
    id,
    userId,
    name: trimmed,
    slug: slugify(trimmed, id),
    recipeSlugs: [],
    createdAt: new Date().toISOString(),
  });
  await ensureDir();
  await writeFile(fileFor(collection.id), JSON.stringify(collection, null, 2), "utf8");
  return collection;
}

export async function addToCollection(
  userId: string,
  collectionId: string,
  recipeSlug: string,
): Promise<KitchenCollection> {
  const collection = await getCollection(collectionId);
  if (!collection || collection.userId !== userId) {
    throw new CollectionError("not_found", "We could not find that collection.");
  }
  if (!collection.recipeSlugs.includes(recipeSlug)) {
    collection.recipeSlugs = [recipeSlug, ...collection.recipeSlugs];
    await writeFile(fileFor(collection.id), JSON.stringify(collection, null, 2), "utf8");
  }
  return collection;
}

export async function removeFromCollection(
  userId: string,
  collectionId: string,
  recipeSlug: string,
): Promise<KitchenCollection> {
  const collection = await getCollection(collectionId);
  if (!collection || collection.userId !== userId) {
    throw new CollectionError("not_found", "We could not find that collection.");
  }
  collection.recipeSlugs = collection.recipeSlugs.filter((slug) => slug !== recipeSlug);
  await writeFile(fileFor(collection.id), JSON.stringify(collection, null, 2), "utf8");
  return collection;
}

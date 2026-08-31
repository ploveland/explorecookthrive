import { z } from "zod";
import { dataDir, newStorageId, parsePublicSlug, parseStorageId, readConfinedJson, readConfinedJsonRecords, writeConfinedJson } from "../fs/safe-path";

const DIR = dataDir("collections");

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
  const collections = await readConfinedJsonRecords(DIR, (raw) => collectionSchema.parse(raw));
  return collections.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listCollections(userId: string): Promise<KitchenCollection[]> {
  const collections = await readAll();
  return collections.filter((item) => item.userId === userId);
}

export async function getCollection(id: string): Promise<KitchenCollection | null> {
  try {
    const raw = await readConfinedJson(DIR, id);
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
  try {
    const safeSlug = parsePublicSlug(slug);
    const bySlug = collections.find((item) => item.slug === safeSlug);
    if (bySlug) return bySlug;
  } catch {
    // not a public slug; it may still be a collection UUID
  }
  try {
    const id = parseStorageId(slug, "uuid");
    return collections.find((item) => item.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function createCollection(userId: string, name: string): Promise<KitchenCollection> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new CollectionError("invalid_input", "Name the collection something you will recognize.");
  }
  const id = newStorageId();
  const collection = collectionSchema.parse({
    id,
    userId,
    name: trimmed,
    slug: slugify(trimmed, id),
    recipeSlugs: [],
    createdAt: new Date().toISOString(),
  });
  await writeConfinedJson(DIR, collection.id, JSON.stringify(collection, null, 2));
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
  const slug = parsePublicSlug(recipeSlug);
  if (!collection.recipeSlugs.includes(slug)) {
    collection.recipeSlugs = [slug, ...collection.recipeSlugs];
    await writeConfinedJson(DIR, collection.id, JSON.stringify(collection, null, 2));
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
  const slug = parsePublicSlug(recipeSlug);
  collection.recipeSlugs = collection.recipeSlugs.filter((item) => item !== slug);
  await writeConfinedJson(DIR, collection.id, JSON.stringify(collection, null, 2));
  return collection;
}

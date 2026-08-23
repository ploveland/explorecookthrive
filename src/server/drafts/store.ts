import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractedRecipeSchema, type ExtractedRecipe, type RecipeDraft } from "../recipes/schema";

const DIR = path.join(process.cwd(), ".data", "drafts");

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

function fileFor(id: string) {
  return path.join(DIR, `${id}.json`);
}

export async function saveDraft(recipe: ExtractedRecipe, id = randomUUID()): Promise<RecipeDraft> {
  await ensureDir();
  const now = new Date().toISOString();
  const draft: RecipeDraft = {
    id,
    recipe: extractedRecipeSchema.parse(recipe),
    createdAt: now,
    updatedAt: now,
  };
  await writeFile(fileFor(id), JSON.stringify(draft, null, 2), "utf8");
  return draft;
}

export async function getDraft(id: string): Promise<RecipeDraft | null> {
  try {
    const raw = await readFile(fileFor(id), "utf8");
    return JSON.parse(raw) as RecipeDraft;
  } catch {
    return null;
  }
}

export async function updateDraft(id: string, recipe: ExtractedRecipe): Promise<RecipeDraft | null> {
  const existing = await getDraft(id);
  if (!existing) return null;
  const draft: RecipeDraft = {
    ...existing,
    recipe: extractedRecipeSchema.parse(recipe),
    updatedAt: new Date().toISOString(),
  };
  await writeFile(fileFor(id), JSON.stringify(draft, null, 2), "utf8");
  return draft;
}

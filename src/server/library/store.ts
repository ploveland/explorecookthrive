import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ConversionJob } from "../convert/schema";
import { assignLibraryTags } from "./tags";
import { publishedRecipeSchema, type PublishedRecipe } from "./schema";

const DIR = path.join(process.cwd(), ".data", "library");

export class LibraryError extends Error {
  constructor(
    public readonly code: "job_not_ready" | "job_not_found",
    message: string,
  ) {
    super(message);
    this.name = "LibraryError";
  }
}

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

function fileFor(id: string) {
  return path.join(DIR, `${id}.json`);
}

function slugify(title: string, id: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 56) || "thrive-recipe";
  return `${base}-${id.slice(0, 8)}`;
}

async function readAll(): Promise<PublishedRecipe[]> {
  try {
    const names = await readdir(DIR);
    const recipes = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const raw = await readFile(path.join(DIR, name), "utf8");
          return publishedRecipeSchema.parse(JSON.parse(raw));
        }),
    );
    return recipes.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch {
    return [];
  }
}

export async function getPublishedById(id: string): Promise<PublishedRecipe | null> {
  try {
    const raw = await readFile(fileFor(id), "utf8");
    return publishedRecipeSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function getPublishedBySlug(slug: string): Promise<PublishedRecipe | null> {
  const recipes = await readAll();
  return recipes.find((recipe) => recipe.slug === slug) ?? null;
}

export async function getPublishedByJobId(jobId: string): Promise<PublishedRecipe | null> {
  const recipes = await readAll();
  return recipes.find((recipe) => recipe.jobId === jobId) ?? null;
}

export async function listPublished(filters?: {
  tag?: string | null;
  query?: string | null;
}): Promise<PublishedRecipe[]> {
  const recipes = await readAll();
  const tag = filters?.tag?.trim().toLowerCase() || null;
  const query = filters?.query?.trim().toLowerCase() || null;

  return recipes.filter((recipe) => {
    if (tag && !recipe.tags.includes(tag)) return false;
    if (!query) return true;
    const haystack = [
      recipe.title,
      recipe.description,
      recipe.originalTitle,
      recipe.cuisine ?? "",
      recipe.category ?? "",
      recipe.tags.join(" "),
      recipe.ingredients.map((item) => item.rawText).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export async function publishFromJob(job: ConversionJob): Promise<PublishedRecipe> {
  if (job.status !== "complete" || !job.output) {
    throw new LibraryError("job_not_ready", "Finish the conversion before publishing.");
  }

  const existing = await getPublishedByJobId(job.id);
  if (existing) return existing;

  const thrive = job.output.thriveVersion;
  const id = randomUUID();
  const recipe = publishedRecipeSchema.parse({
    id,
    slug: slugify(thrive.title, id),
    jobId: job.id,
    title: thrive.title,
    description: thrive.description,
    originalTitle: job.recipe.originalTitle ?? job.recipe.title,
    sourceUrl: job.recipe.sourceUrl,
    sourceSite: job.recipe.sourceSite,
    sourceAuthor: job.recipe.sourceAuthor,
    servings: thrive.servings,
    prepMinutes: thrive.prepMinutes,
    cookMinutes: thrive.cookMinutes,
    cuisine: job.recipe.cuisine,
    category: job.recipe.category,
    goals: job.goals,
    dietary: job.dietary,
    preference: job.preference,
    tasteImpact: job.output.analysis.tasteImpact,
    tags: assignLibraryTags({
      title: thrive.title,
      originalTitle: job.recipe.originalTitle ?? job.recipe.title,
      description: thrive.description,
      cuisine: job.recipe.cuisine,
      category: job.recipe.category,
      instructions: thrive.instructions,
      prepMinutes: thrive.prepMinutes,
      cookMinutes: thrive.cookMinutes,
      goals: job.goals,
      dietary: job.dietary,
    }),
    ingredients: thrive.ingredients,
    instructions: thrive.instructions,
    changes: job.output.changes,
    wouldNotChange: job.output.analysis.wouldNotChange,
    nutrition: job.nutrition,
    provider: job.provider,
    publishedAt: new Date().toISOString(),
  });

  await ensureDir();
  await writeFile(fileFor(recipe.id), JSON.stringify(recipe, null, 2), "utf8");
  return recipe;
}

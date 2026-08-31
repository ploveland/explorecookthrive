import { canViewPublishedRecipe, ownsPublishedRecipe } from "../accounts/kitchen-access";
import type { ConversionJob } from "../convert/schema";
import {
  dataDir,
  newStorageId,
  parsePublicSlug,
  readConfinedJson,
  readConfinedJsonRecords,
  writeConfinedJson,
} from "../fs/safe-path";
import { assignLibraryTags } from "./tags";
import { matchesNutritionFilters, type NutritionFilters } from "./nutrition-filter";
import { publishedRecipeSchema, type PublishedRecipe } from "./schema";

const DIR = dataDir("library");

export class LibraryError extends Error {
  constructor(
    public readonly code: "job_not_ready" | "job_not_found" | "not_owner",
    message: string,
  ) {
    super(message);
    this.name = "LibraryError";
  }
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
  const recipes = await readConfinedJsonRecords(DIR, (raw) => publishedRecipeSchema.parse(raw));
  return recipes.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPublishedById(id: string): Promise<PublishedRecipe | null> {
  try {
    const raw = await readConfinedJson(DIR, id);
    return publishedRecipeSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function getPublishedBySlug(slug: string): Promise<PublishedRecipe | null> {
  try {
    const safe = parsePublicSlug(slug);
    const recipes = await readAll();
    return recipes.find((recipe) => recipe.slug === safe) ?? null;
  } catch {
    return null;
  }
}

export async function getPublishedByJobId(jobId: string): Promise<PublishedRecipe | null> {
  const recipes = await readAll();
  return recipes.find((recipe) => recipe.jobId === jobId) ?? null;
}

export async function indexPublishedSlugs(): Promise<Map<string, string>> {
  const recipes = await readAll();
  return new Map(recipes.map((recipe) => [recipe.jobId, recipe.slug]));
}

export async function listPublished(filters?: {
  tag?: string | null;
  query?: string | null;
  nutrition?: NutritionFilters | null;
}): Promise<PublishedRecipe[]> {
  const recipes = await readAll();
  const tag = filters?.tag?.trim().toLowerCase() || null;
  const query = filters?.query?.trim().toLowerCase() || null;
  const nutrition = filters?.nutrition ?? null;

  return recipes.filter((recipe) => {
    if (recipe.visibility !== "public") return false;
    if (tag && !recipe.tags.includes(tag)) return false;
    if (nutrition && !matchesNutritionFilters(recipe, nutrition)) return false;
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

export async function getVisibleBySlug(
  slug: string,
  viewerId?: string | null,
): Promise<PublishedRecipe | null> {
  const recipe = await getPublishedBySlug(slug);
  if (!recipe) return null;
  if (!canViewPublishedRecipe(recipe, viewerId)) return null;
  return recipe;
}

export async function setRecipeVisibility(
  slug: string,
  ownerId: string,
  visibility: PublishedRecipe["visibility"],
): Promise<PublishedRecipe | null> {
  const recipe = await getPublishedBySlug(slug);
  if (!recipe || !ownsPublishedRecipe(recipe, ownerId)) return null;
  const next = publishedRecipeSchema.parse({ ...recipe, visibility });
  await writeConfinedJson(DIR, next.id, JSON.stringify(next, null, 2));
  return next;
}

export async function listPublishedByOwner(ownerId: string): Promise<PublishedRecipe[]> {
  const recipes = await readAll();
  return recipes.filter((recipe) => recipe.ownerId === ownerId);
}

export async function publishFromJob(
  job: ConversionJob,
  owner?: { ownerId: string; ownerName: string } | null,
): Promise<PublishedRecipe> {
  if (job.status !== "complete" || !job.output) {
    throw new LibraryError("job_not_ready", "Finish the conversion before publishing.");
  }

  const existing = await getPublishedByJobId(job.id);
  if (existing) {
    if (owner?.ownerId && existing.ownerId && existing.ownerId !== owner.ownerId) {
      throw new LibraryError("not_owner", "Only the kitchen that published this can publish it again.");
    }
    return existing;
  }

  const thrive = job.output.thriveVersion;
  const id = newStorageId();
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
    ownerId: owner?.ownerId ?? null,
    ownerName: owner?.ownerName ?? null,
    visibility: "public",
    publishedAt: new Date().toISOString(),
  });

  await writeConfinedJson(DIR, recipe.id, JSON.stringify(recipe, null, 2));
  return recipe;
}

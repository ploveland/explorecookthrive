import type { PublishedRecipe } from "./schema";

export type NutritionFilters = {
  maxCalories: number | null;
  minProtein: number | null;
  minFiber: number | null;
  maxSodium: number | null;
};

export function emptyNutritionFilters(): NutritionFilters {
  return {
    maxCalories: null,
    minProtein: null,
    minFiber: null,
    maxSodium: null,
  };
}

export function parsePositiveBound(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function parseNutritionFilters(params: {
  maxCal?: string;
  minProtein?: string;
  minFiber?: string;
  maxSodium?: string;
}): NutritionFilters {
  return {
    maxCalories: parsePositiveBound(params.maxCal),
    minProtein: parsePositiveBound(params.minProtein),
    minFiber: parsePositiveBound(params.minFiber),
    maxSodium: parsePositiveBound(params.maxSodium),
  };
}

export function hasNutritionFilters(filters: NutritionFilters) {
  return (
    filters.maxCalories != null ||
    filters.minProtein != null ||
    filters.minFiber != null ||
    filters.maxSodium != null
  );
}

export function thrivePerServing(recipe: Pick<PublishedRecipe, "nutrition">) {
  return recipe.nutrition?.thrive.perServing ?? recipe.nutrition?.thrive.totals ?? null;
}

export function matchesNutritionFilters(
  recipe: Pick<PublishedRecipe, "nutrition">,
  filters: NutritionFilters,
) {
  if (!hasNutritionFilters(filters)) return true;
  const nutrients = thrivePerServing(recipe);
  if (!nutrients) return false;
  if (filters.maxCalories != null && nutrients.calories > filters.maxCalories) return false;
  if (filters.minProtein != null && nutrients.proteinG < filters.minProtein) return false;
  if (filters.minFiber != null && nutrients.fiberG < filters.minFiber) return false;
  if (filters.maxSodium != null && nutrients.sodiumMg > filters.maxSodium) return false;
  return true;
}

export function nutritionQuery(filters: NutritionFilters) {
  const params = new URLSearchParams();
  if (filters.maxCalories != null) params.set("maxCal", String(filters.maxCalories));
  if (filters.minProtein != null) params.set("minProtein", String(filters.minProtein));
  if (filters.minFiber != null) params.set("minFiber", String(filters.minFiber));
  if (filters.maxSodium != null) params.set("maxSodium", String(filters.maxSodium));
  return params;
}

export function libraryHref(input: {
  path?: "/recipes" | "/search";
  tag?: string | null;
  tested?: boolean;
  q?: string | null;
  nutrition?: NutritionFilters;
}) {
  const path = input.path ?? "/recipes";
  const params = nutritionQuery(input.nutrition ?? emptyNutritionFilters());
  if (input.tag) params.set("tag", input.tag);
  if (input.tested) params.set("tested", "1");
  if (input.q) params.set("q", input.q);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

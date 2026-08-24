import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CATALOG, type CatalogFood, findCatalogFood } from "./catalog";
import { emptyNutrients, type NutrientTotals } from "./schema";

const FDC_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
const CACHE_DIR = path.join(process.cwd(), ".data", "fdc");

const NUTRIENT_IDS: Record<number, keyof NutrientTotals> = {
  1008: "calories",
  1003: "proteinG",
  1004: "fatG",
  1258: "saturatedFatG",
  1005: "carbsG",
  1079: "fiberG",
  2000: "sugarG",
  1093: "sodiumMg",
};

type FdcSearchFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  foodNutrients?: { nutrientId?: number; value?: number; nutrientNumber?: string }[];
};

function apiKey() {
  return process.env.USDA_FDC_API_KEY?.trim() || "";
}

export function hasLiveFdc() {
  return Boolean(apiKey());
}

function nutrientsFromFdc(food: FdcSearchFood): NutrientTotals {
  const totals = emptyNutrients();
  for (const row of food.foodNutrients ?? []) {
    const id = row.nutrientId;
    if (!id || row.value === undefined) continue;
    const key = NUTRIENT_IDS[id];
    if (key) totals[key] = row.value;
  }
  return totals;
}

async function readCache(key: string): Promise<CatalogFood | null> {
  try {
    const raw = await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
    return JSON.parse(raw) as CatalogFood;
  } catch {
    return null;
  }
}

async function writeCache(key: string, food: CatalogFood) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(food), "utf8");
}

function cacheKey(query: string) {
  return query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "query";
}

export async function resolveFood(name: string): Promise<CatalogFood | null> {
  const local = findCatalogFood(name);
  if (local) return local;
  if (!hasLiveFdc()) return null;

  const key = cacheKey(name);
  const cached = await readCache(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(FDC_SEARCH);
    url.searchParams.set("api_key", apiKey());
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        query: name,
        pageSize: 5,
        dataType: ["Foundation", "SR Legacy"],
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { foods?: FdcSearchFood[] };
    const hit = payload.foods?.find((food) => (food.foodNutrients?.length ?? 0) > 0);
    if (!hit) return null;
    const mapped: CatalogFood = {
      id: `fdc-${hit.fdcId}`,
      fdcId: hit.fdcId,
      description: hit.description,
      aliases: [name],
      per100g: nutrientsFromFdc(hit),
    };
    await writeCache(key, mapped);
    return mapped;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function catalogSize() {
  return CATALOG.length;
}

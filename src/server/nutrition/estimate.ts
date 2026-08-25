import { shouldIgnoreIngredient } from "./catalog";
import { resolveFood, hasLiveFdc } from "./fdc";
import { toGrams, isConvertibleUnit } from "./grams";
import { parseIngredientLine } from "../recipes/parse-ingredient";
import {
  addNutrients,
  emptyNutrients,
  nutritionComparisonSchema,
  roundNutrients,
  scaleNutrients,
  subtractNutrients,
  type IngredientNutrition,
  type NutrientTotals,
  type NutritionComparison,
  type RecipeNutrition,
} from "./schema";

export type NutritionIngredientInput = {
  rawText: string;
  name: string | null;
  quantity: number | null;
  unit: string | null;
};

function confidenceFor(mapped: number, assumed: number, unmapped: number, total: number): RecipeNutrition["confidence"] {
  if (total === 0) return "low";
  if (unmapped === 0 && assumed <= Math.max(1, Math.floor(total / 4))) return "high";
  if (unmapped / total <= 0.25) return "medium";
  return "low";
}

function per100gToAmount(per100g: NutrientTotals, grams: number): NutrientTotals {
  return scaleNutrients(per100g, grams / 100);
}

async function estimateIngredient(item: NutritionIngredientInput): Promise<IngredientNutrition> {
  const parsed = parseIngredientLine(item.rawText);
  const quantity = parsed.quantity ?? item.quantity;
  const unit = parsed.unit ?? (isConvertibleUnit(item.unit) ? item.unit : null);
  const label = parsed.name?.trim() || item.name?.trim() || item.rawText;
  if (shouldIgnoreIngredient(label) || shouldIgnoreIngredient(item.rawText)) {
    return {
      rawText: item.rawText,
      matchedName: null,
      fdcId: null,
      grams: null,
      nutrients: null,
      status: "ignored",
      note: "Kitchen tool or garnish, not counted.",
    };
  }

  const food =
    (await resolveFood(label)) ??
    (parsed.name ? await resolveFood(parsed.name) : null) ??
    (await resolveFood(item.rawText));
  if (!food) {
    return {
      rawText: item.rawText,
      matchedName: null,
      fdcId: null,
      grams: null,
      nutrients: null,
      status: "unmapped",
      note: `No USDA match for “${label}”.`,
    };
  }

  const converted = toGrams(quantity, unit, food, item.rawText);
  if (converted.grams === null) {
    return {
      rawText: item.rawText,
      matchedName: food.description,
      fdcId: food.fdcId,
      grams: null,
      nutrients: null,
      status: "unmapped",
      note: converted.note ?? `Matched ${food.description}, but the amount could not be converted to grams.`,
    };
  }

  return {
    rawText: item.rawText,
    matchedName: food.description,
    fdcId: food.fdcId,
    grams: Math.round(converted.grams * 10) / 10,
    nutrients: roundNutrients(per100gToAmount(food.per100g, converted.grams)),
    status: converted.assumed ? "assumed" : "mapped",
    note: converted.note,
  };
}

export async function estimateRecipeNutrition(
  ingredients: NutritionIngredientInput[],
  servings: number | null,
): Promise<RecipeNutrition> {
  const lines = await Promise.all(ingredients.map((item) => estimateIngredient(item)));
  const countable = lines.filter((line) => line.status !== "ignored");
  let totals = emptyNutrients();
  for (const line of lines) {
    if (line.nutrients) totals = addNutrients(totals, line.nutrients);
  }
  totals = roundNutrients(totals);
  const mappedCount = countable.filter((line) => line.status === "mapped").length;
  const assumedCount = countable.filter((line) => line.status === "assumed").length;
  const unmappedCount = countable.filter((line) => line.status === "unmapped").length;
  const notes: string[] = [];
  if (assumedCount > 0) {
    notes.push(
      `${assumedCount} ingredient${assumedCount === 1 ? "" : "s"} used a typical kitchen weight (an onion, a can, a stick of butter).`,
    );
  }
  if (unmappedCount > 0) {
    notes.push(
      `${unmappedCount} ingredient${unmappedCount === 1 ? "" : "s"} could not be matched or converted, so the total is incomplete.`,
    );
  }
  if (!servings) {
    notes.push("Servings were missing, so per-serving numbers are not shown.");
  }

  return {
    servings,
    totals,
    perServing: servings && servings > 0 ? roundNutrients(scaleNutrients(totals, 1 / servings)) : null,
    confidence: confidenceFor(mappedCount, assumedCount, unmappedCount, countable.length),
    mappedCount,
    unmappedCount,
    assumedCount,
    ingredients: lines,
    notes,
  };
}

export async function compareRecipeNutrition(input: {
  original: NutritionIngredientInput[];
  originalServings: number | null;
  thrive: NutritionIngredientInput[];
  thriveServings: number | null;
}): Promise<NutritionComparison> {
  const original = await estimateRecipeNutrition(input.original, input.originalServings);
  const thrive = await estimateRecipeNutrition(input.thrive, input.thriveServings);
  const deltaPerServing =
    original.perServing && thrive.perServing
      ? roundNutrients(subtractNutrients(thrive.perServing, original.perServing))
      : null;

  return nutritionComparisonSchema.parse({
    source: hasLiveFdc() ? "usda_fdc" : "usda_fdc_local",
    sourceLabel: hasLiveFdc()
      ? "USDA FoodData Central"
      : "USDA FoodData Central values (local catalog; add USDA_FDC_API_KEY for live lookup)",
    original,
    thrive,
    deltaPerServing,
  });
}

import { nutritionSideEstimated } from "./display";
import type { NutritionComparison } from "./schema";

export type NutritionHighlight = {
  calories: string | null;
  improvement: string | null;
};

function roundCal(value: number) {
  return `${Math.round(value)}`;
}

function roundGrams(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function nutritionCardHighlight(
  nutrition: NutritionComparison | null | undefined,
): NutritionHighlight | null {
  if (!nutrition) return null;
  const originalOk = nutritionSideEstimated(nutrition.original);
  const thriveOk = nutritionSideEstimated(nutrition.thrive);
  const original = nutrition.original.perServing ?? nutrition.original.totals;
  const thrive = nutrition.thrive.perServing ?? nutrition.thrive.totals;
  const calorieDelta = thrive.calories - original.calories;
  const proteinDelta = thrive.proteinG - original.proteinG;
  const fiberDelta = thrive.fiberG - original.fiberG;

  const calories =
    originalOk && thriveOk && (original.calories > 0 || thrive.calories > 0)
      ? `${roundCal(original.calories)} → ${roundCal(thrive.calories)} cal`
      : thriveOk && thrive.calories > 0
        ? `${roundCal(thrive.calories)} cal`
        : originalOk && original.calories > 0
          ? `${roundCal(original.calories)} cal`
          : null;

  const improvements: string[] = [];
  if (originalOk && thriveOk) {
    if (original.calories > 0 && calorieDelta < -10) {
      const pct = Math.round((Math.abs(calorieDelta) / original.calories) * 100);
      if (pct >= 5) improvements.push(`${pct}% fewer calories`);
    }
    if (proteinDelta >= 1) improvements.push(`+${roundGrams(proteinDelta)}g protein`);
    if (fiberDelta >= 0.5) improvements.push(`+${roundGrams(fiberDelta)}g fiber`);
  }

  if (!calories && improvements.length === 0) return null;
  return {
    calories,
    improvement: improvements[0] ?? null,
  };
}

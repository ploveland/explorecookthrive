import type { NutrientTotals, NutritionConfidence } from "./schema";

export const NUTRIENT_ROWS: {
  key: keyof NutrientTotals;
  label: string;
  suffix: string;
  invert: boolean;
}[] = [
  { key: "calories", label: "Calories", suffix: "", invert: true },
  { key: "proteinG", label: "Protein", suffix: "g", invert: false },
  { key: "fiberG", label: "Fiber", suffix: "g", invert: false },
  { key: "fatG", label: "Fat", suffix: "g", invert: true },
  { key: "saturatedFatG", label: "Saturated fat", suffix: "g", invert: true },
  { key: "carbsG", label: "Carbs", suffix: "g", invert: true },
  { key: "sugarG", label: "Sugar", suffix: "g", invert: true },
  { key: "sodiumMg", label: "Sodium", suffix: "mg", invert: true },
];

export function formatNutrientValue(key: keyof NutrientTotals, value: number) {
  if (key === "calories" || key === "sodiumMg") return `${Math.round(value)}`;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function nutritionSideEstimated(side: {
  mappedCount: number;
  assumedCount: number;
}) {
  return side.mappedCount + side.assumedCount > 0;
}

export function formatNutrientDelta(key: keyof NutrientTotals, value: number) {
  const abs = formatNutrientValue(key, Math.abs(value));
  if (Math.abs(value) < 0.05) return "0";
  return `${value > 0 ? "+" : "−"}${abs}`;
}

export function nutrientDeltaTone(value: number, invert: boolean) {
  if (Math.abs(value) < 0.05) return "same" as const;
  const improved = invert ? value < 0 : value > 0;
  return improved ? ("improved" as const) : ("not an improvement" as const);
}

export function nutrientDeltaClass(value: number, invert: boolean) {
  const tone = nutrientDeltaTone(value, invert);
  if (tone === "same") return "text-teal/70";
  return tone === "improved" ? "text-teal" : "text-terracotta-strong";
}

export function confidenceCopy(confidence: NutritionConfidence) {
  if (confidence === "high") return "Most ingredients matched USDA foods with measured amounts.";
  if (confidence === "medium") return "Some amounts used typical kitchen weights, like a medium onion or a can.";
  return "Several ingredients could not be matched or had no amount, so treat this as a rough sketch.";
}

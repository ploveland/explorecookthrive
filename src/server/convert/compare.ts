import { subtractNutrients, type NutrientTotals } from "../nutrition/schema";
import type { ConversionJob } from "./schema";
import { sameKitchen } from "./versions";

export type ComparePairError =
  | "same_version"
  | "different_original"
  | "not_complete"
  | "different_kitchen";

export function pairThriveJobs(
  left: ConversionJob,
  right: ConversionJob,
): { ok: true } | { ok: false; reason: ComparePairError } {
  if (left.id === right.id) return { ok: false, reason: "same_version" };
  if (left.status !== "complete" || right.status !== "complete" || !left.output || !right.output) {
    return { ok: false, reason: "not_complete" };
  }
  if (left.draftId !== right.draftId) return { ok: false, reason: "different_original" };
  if (!sameKitchen(left, right)) return { ok: false, reason: "different_kitchen" };
  return { ok: true };
}

export function thriveNutrients(job: ConversionJob): NutrientTotals | null {
  return job.nutrition?.thrive.perServing ?? job.nutrition?.thrive.totals ?? null;
}

export function compareThriveNutrition(left: ConversionJob, right: ConversionJob) {
  const leftValues = thriveNutrients(left);
  const rightValues = thriveNutrients(right);
  return {
    left: leftValues,
    right: rightValues,
    delta: leftValues && rightValues ? subtractNutrients(rightValues, leftValues) : null,
    perServing: Boolean(left.nutrition?.thrive.perServing && right.nutrition?.thrive.perServing),
    sourceLabel: left.nutrition?.sourceLabel ?? right.nutrition?.sourceLabel ?? "USDA FoodData Central",
  };
}

export function linePresence(leftLines: string[], rightLines: string[]) {
  const normalize = (value: string) => value.trim().toLowerCase();
  const rightSet = new Set(rightLines.map(normalize));
  const leftSet = new Set(leftLines.map(normalize));
  return {
    leftOnly: leftLines.filter((line) => !rightSet.has(normalize(line))),
    rightOnly: rightLines.filter((line) => !leftSet.has(normalize(line))),
    both: leftLines.filter((line) => rightSet.has(normalize(line))),
  };
}

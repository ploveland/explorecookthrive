import { z } from "zod";
import { conversionOutputSchema, type ConversionOutput } from "../ai/types";

export const evalCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  goals: z.array(z.string()),
  preference: z.enum(["preserve", "preserve", "balanced", "maximum"]),
  notes: z.string(),
  original: z.object({
    title: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
  }),
  mustPreserve: z.array(z.string()),
  mustNotSuggest: z.array(z.string()),
  allowedAdditions: z.array(z.string()).default([]),
});

export type EvalCase = z.infer<typeof evalCaseSchema>;

export type EvalDeduction = {
  rule: string;
  detail: string;
};

export type EvalScore = {
  caseId: string;
  pass: boolean;
  deductions: EvalDeduction[];
};

const MEDICAL_CLAIM =
  /\b(cure|treat|prevent|reverse)\b.{0,40}\b(disease|diabetes|cancer|heart disease|cholesterol)\b/i;

function includesPhrase(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function blobFromOutput(output: ConversionOutput) {
  return JSON.stringify(output).toLowerCase();
}

export function scoreConversion(evalCase: EvalCase, output: ConversionOutput): EvalScore {
  const deductions: EvalDeduction[] = [];
  const blob = blobFromOutput(output);
  const thriveNames = output.thriveVersion.ingredients.map((item) => item.name.toLowerCase());
  const originalNames = evalCase.original.ingredients.map((item) => item.toLowerCase());

  const parsed = conversionOutputSchema.safeParse(output);
  if (!parsed.success) {
    deductions.push({
      rule: "schema",
      detail: "Conversion output did not match the required schema.",
    });
  }

  if (output.analysis.wouldNotChange.length === 0) {
    deductions.push({
      rule: "would-not-change",
      detail: "Thrive output must explain what should stay.",
    });
  }

  for (const item of evalCase.mustPreserve) {
    const keptInIngredients = thriveNames.some((name) => includesPhrase(name, item));
    const mentioned = output.analysis.wouldNotChange.some((entry) =>
      includesPhrase(entry.item, item),
    );
    if (!keptInIngredients && !mentioned) {
      deductions.push({
        rule: "must-preserve",
        detail: `Load-bearing item was dropped without justification: ${item}`,
      });
    }
  }

  for (const banned of evalCase.mustNotSuggest) {
    if (includesPhrase(blob, banned)) {
      deductions.push({
        rule: "must-not-suggest",
        detail: `Unjustified diet swap appeared: ${banned}`,
      });
    }
  }

  for (const ingredient of output.thriveVersion.ingredients) {
    const name = ingredient.name.toLowerCase();
    const known =
      originalNames.some((original) => includesPhrase(original, name) || includesPhrase(name, original)) ||
      evalCase.allowedAdditions.some((allowed) => includesPhrase(name, allowed));
    if (!known && name.length > 2) {
      const introducedInChange = output.changes.some((change) =>
        includesPhrase(change.suggested, ingredient.name),
      );
      if (!introducedInChange) {
        deductions.push({
          rule: "invented-ingredient",
          detail: `Ingredient is not in the original recipe and was not explained: ${ingredient.name}`,
        });
      }
    }
  }

  if (MEDICAL_CLAIM.test(blob)) {
    deductions.push({
      rule: "medical-claim",
      detail: "Output made a disease treatment or prevention claim.",
    });
  }

  if ("nutrition" in output) {
    deductions.push({
      rule: "llm-nutrition",
      detail: "Model payload included nutrition numbers. Macros must come from USDA FDC.",
    });
  }

  for (const change of output.changes) {
    if (!change.nutritionReason || !change.flavorEffect || !change.textureEffect) {
      deductions.push({
        rule: "change-rationale",
        detail: `Change "${change.original}" is missing nutrition, flavor, or texture rationale.`,
      });
    }
  }

  return {
    caseId: evalCase.id,
    pass: deductions.length === 0,
    deductions,
  };
}

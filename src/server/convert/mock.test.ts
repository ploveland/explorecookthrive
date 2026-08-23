import { describe, expect, it } from "vitest";
import { conversionOutputSchema } from "../ai/types";
import { loadEvalCases } from "../eval/load-cases";
import { scoreConversion } from "../eval/score";
import { inputFromEvalCase } from "./from-recipe";
import { mockConvert } from "./mock";
import { CONVERSION_SYSTEM_PROMPT, buildConversionPrompt } from "./prompt";

const cases = loadEvalCases();

describe("culinary mock conversion", () => {
  it("loads the five first-class fixtures", () => {
    expect(cases.map((item) => item.id).sort()).toEqual([
      "buttermilk-biscuits-keep-butter",
      "carbonara-no-skim-cream",
      "chili-no-invented-ingredients",
      "chocolate-layer-cake-no-applesauce",
      "fried-chicken-keep-crust",
    ]);
  });

  it.each(cases.map((evalCase) => [evalCase.id, evalCase] as const))(
    "passes eval fixture %s",
    (_id, evalCase) => {
      const output = mockConvert(inputFromEvalCase(evalCase));
      expect(conversionOutputSchema.safeParse(output).success).toBe(true);
      const score = scoreConversion(evalCase, output);
      expect(score.deductions).toEqual([]);
      expect(score.pass).toBe(true);
    },
  );

  it("does not invent a vegan carbonara", () => {
    const carbonara = cases.find((item) => item.id === "carbonara-no-skim-cream");
    expect(carbonara).toBeDefined();
    const output = mockConvert(
      inputFromEvalCase({
        ...carbonara!,
        preference: "preserve",
      }),
    );
    const vegan = mockConvert({
      ...inputFromEvalCase(carbonara!),
      dietary: ["vegan"],
    });
    expect(vegan.analysis.assumptions.some((note) => /vegan/i.test(note))).toBe(true);
    expect(JSON.stringify(output).toLowerCase()).not.toMatch(/cashew|skim milk|zucchini noodle/);
  });
});

describe("conversion prompt", () => {
  it("encodes culinary guardrails", () => {
    const blob = CONVERSION_SYSTEM_PROMPT.toLowerCase();
    expect(blob).toContain("applesauce");
    expect(blob).toContain("wouldnotchange");
    expect(blob).toContain("nutrition");
    expect(blob).not.toMatch(/cure diabetes|treat heart disease/);
  });

  it("names the chosen goals and preference", () => {
    const biscuits = cases.find((item) => item.id === "buttermilk-biscuits-keep-butter")!;
    const prompt = buildConversionPrompt(inputFromEvalCase(biscuits));
    expect(prompt).toContain("Healthier overall");
    expect(prompt).toContain("balanced");
    expect(prompt).toContain("Buttermilk biscuits");
  });
});

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

  it("rewrites biscuit ingredients and method instead of copying the original", () => {
    const biscuits = cases.find((item) => item.id === "buttermilk-biscuits-keep-butter")!;
    const output = mockConvert(inputFromEvalCase(biscuits));
    const lines = output.thriveVersion.ingredients.map((item) => item.rawText.toLowerCase());
    expect(lines.some((line) => line.includes("white whole wheat"))).toBe(true);
    expect(lines).not.toContain("2 cups all-purpose flour");
    expect(output.thriveVersion.instructions.join(" ")).toMatch(/weigh/i);
    expect(output.thriveVersion.instructions).not.toEqual(biscuits.original.instructions);
  });

  it("does not list a thermometer as a fried-chicken ingredient", () => {
    const chicken = cases.find((item) => item.id === "fried-chicken-keep-crust")!;
    const output = mockConvert(inputFromEvalCase(chicken));
    expect(output.thriveVersion.ingredients.map((item) => item.name).join(" ")).not.toMatch(/thermometer/i);
    expect(output.thriveVersion.instructions.join(" ")).toMatch(/rack/i);
  });

  it("rewrites a cream chowder instead of leaving the pot unchanged", () => {
    const output = mockConvert({
      title: "Creamy seafood chowder",
      description: "A cream chowder.",
      servings: 6,
      prepMinutes: 20,
      cookMinutes: 40,
      ingredients: [
        { rawText: "2 cups heavy cream", name: "heavy cream", quantity: 2, unit: "cup", preparation: null },
        { rawText: "1 pound shrimp", name: "shrimp", quantity: 1, unit: "pound", preparation: null },
        { rawText: "1 onion", name: "onion", quantity: 1, unit: null, preparation: null },
        { rawText: "2 tablespoons butter", name: "butter", quantity: 2, unit: "tablespoon", preparation: null },
      ],
      instructions: ["Simmer seafood in cream."],
      goals: ["lower_calories", "lower_saturated_fat"],
      preference: "balanced",
      dietary: [],
    });
    const blob = JSON.stringify(output.thriveVersion).toLowerCase();
    expect(blob).toMatch(/stock|milk/);
    expect(output.thriveVersion.instructions).not.toEqual(["Simmer seafood in cream."]);
    expect(output.thriveVersion.ingredients.some((item) => /cream/i.test(item.rawText))).toBe(true);
  });
});

describe("conversion prompt", () => {
  it("encodes culinary guardrails", () => {
    const blob = CONVERSION_SYSTEM_PROMPT.toLowerCase();
    expect(blob).toContain("applesauce");
    expect(blob).toContain("wouldnotchange");
    expect(blob).toContain("nutrition");
    expect(blob).toContain("thriveversion");
    expect(blob).toContain("do not paste the original");
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

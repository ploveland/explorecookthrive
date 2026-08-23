import { parseIngredientLine } from "../recipes/parse-ingredient";
import type { ExtractedRecipe } from "../recipes/schema";
import type { EvalCase } from "../eval/score";
import type {
  ConvertRecipeInput,
  DietaryRequirementId,
  NutritionGoalId,
  TastePreferenceId,
} from "./schema";

export function inputFromExtractedRecipe(
  recipe: ExtractedRecipe,
  goals: NutritionGoalId[],
  preference: TastePreferenceId,
  dietary: DietaryRequirementId[],
): ConvertRecipeInput {
  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    ingredients: recipe.ingredients.map((item) => ({
      rawText: item.rawText,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      preparation: item.preparation,
    })),
    instructions: recipe.instructions,
    goals,
    preference,
    dietary,
  };
}

export function inputFromEvalCase(evalCase: EvalCase): ConvertRecipeInput {
  return {
    title: evalCase.original.title,
    description: evalCase.notes,
    servings: 4,
    prepMinutes: null,
    cookMinutes: null,
    ingredients: evalCase.original.ingredients.map((line) => {
      const parsed = parseIngredientLine(line);
      return {
        rawText: parsed.rawText,
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        preparation: parsed.preparation,
      };
    }),
    instructions: evalCase.original.instructions,
    goals: evalCase.goals as NutritionGoalId[],
    preference: evalCase.preference,
    dietary: [],
  };
}

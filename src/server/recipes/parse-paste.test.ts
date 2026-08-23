import { describe, expect, it } from "vitest";
import { parsePastedRecipe } from "./parse-paste";
import { extractedRecipeSchema } from "./schema";

const SAMPLE = `Chicken Fried Steak

Serves 4
Prep time: 20 minutes
Cook time: 25 minutes

Ingredients
1 1/2 pounds cube steak
1 cup all-purpose flour
1 teaspoon kosher salt
1/2 teaspoon black pepper
1 cup buttermilk
1/2 cup vegetable oil

Instructions
1. Season the steak with salt and pepper.
2. Dredge in flour, dip in buttermilk, then flour again.
3. Fry in 350°F oil until the crust is deep gold.
4. Rest on a wire rack, not paper towels.
`;

describe("parsePastedRecipe", () => {
  it("splits ingredients and steps from labeled paste", () => {
    const recipe = parsePastedRecipe(SAMPLE);
    expect(() => extractedRecipeSchema.parse(recipe)).not.toThrow();
    expect(recipe.title).toBe("Chicken Fried Steak");
    expect(recipe.servings).toBe(4);
    expect(recipe.prepMinutes).toBe(20);
    expect(recipe.ingredients.find((item) => /cube steak/i.test(item.name ?? ""))?.quantity).toBeCloseTo(
      1.5,
    );
    expect(recipe.instructions[0]).toMatch(/Season the steak/i);
    expect(recipe.extractor).toBe("paste");
  });

  it("still returns a recipe when the paste is messy", () => {
    const recipe = parsePastedRecipe("Soup\nwater\nonion\nSimmer until it tastes like soup.");
    expect(recipe.title).toBe("Soup");
    expect(recipe.ingredients.length).toBeGreaterThan(0);
    expect(recipe.instructions.length).toBeGreaterThan(0);
  });
});

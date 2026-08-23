import { describe, expect, it } from "vitest";
import { recipeFromJsonLd } from "./parse-jsonld";

const html = `<!doctype html>
<html>
  <head>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Skillet Cornbread",
        "recipeYield": "8",
        "prepTime": "PT15M",
        "cookTime": "PT25M",
        "recipeIngredient": [
          "1 cup yellow cornmeal",
          "1 cup all-purpose flour",
          "4 tablespoons unsalted butter, melted"
        ],
        "recipeInstructions": [
          { "@type": "HowToStep", "text": "Heat a 10-inch skillet in a 425°F oven." },
          { "@type": "HowToStep", "text": "Stir the batter, pour, and bake until gold at the edges." }
        ]
      }
    </script>
  </head>
  <body></body>
</html>`;

describe("recipeFromJsonLd", () => {
  it("reads a schema.org Recipe block", () => {
    const recipe = recipeFromJsonLd(html, "https://example.com/skillet-cornbread");
    expect(recipe?.title).toBe("Skillet Cornbread");
    expect(recipe?.servings).toBe(8);
    expect(recipe?.prepMinutes).toBe(15);
    expect(recipe?.cookMinutes).toBe(25);
    expect(recipe?.ingredients).toHaveLength(3);
    expect(recipe?.ingredients[2]?.name).toMatch(/butter/i);
    expect(recipe?.instructions[0]).toMatch(/skillet/i);
    expect(recipe?.extractor).toBe("jsonld");
    expect(recipe?.sourceSite).toBe("example.com");
  });

  it("returns null when the page has no recipe", () => {
    expect(recipeFromJsonLd("<html><body>Hello</body></html>", "https://example.com")).toBeNull();
  });
});

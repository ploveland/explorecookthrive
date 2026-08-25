import { describe, expect, it } from "vitest";
import { parseIngredientLine } from "./parse-ingredient";

describe("parseIngredientLine", () => {
  it("reads a period after lb and oz", () => {
    expect(parseIngredientLine("1 lb. ground beef")).toMatchObject({
      quantity: 1,
      unit: "lb",
      name: "ground beef",
    });
    expect(parseIngredientLine("8 oz. cream cheese")).toMatchObject({
      quantity: 8,
      unit: "oz",
      name: "cream cheese",
    });
    expect(parseIngredientLine("2 lbs. bone-in chicken thighs")).toMatchObject({
      quantity: 2,
      unit: "lbs",
      name: "bone-in chicken thighs",
    });
  });

  it("reads unicode fractions and mixed amounts", () => {
    expect(parseIngredientLine("1½ cups all-purpose flour")).toMatchObject({
      quantity: 1.5,
      unit: "cups",
      name: "all-purpose flour",
    });
    expect(parseIngredientLine("1 1/2 pounds cube steak")).toMatchObject({
      quantity: 1.5,
      unit: "pounds",
      name: "cube steak",
    });
  });

  it("reads canned weights without dropping the food", () => {
    expect(parseIngredientLine("1 (15 oz) can black beans, drained")).toMatchObject({
      quantity: 1,
      unit: "can",
      name: "black beans",
      preparation: "drained",
    });
    expect(parseIngredientLine("1 15-ounce can crushed tomatoes")).toMatchObject({
      quantity: 1,
      unit: "can",
      name: "crushed tomatoes",
    });
  });

  it("keeps whole as part of the name so a bird is not a unit", () => {
    expect(parseIngredientLine("1 whole chicken, cut up")).toMatchObject({
      quantity: 1,
      unit: null,
      name: "whole chicken",
      preparation: "cut up",
    });
  });

  it("averages a simple range", () => {
    expect(parseIngredientLine("2-3 tablespoons olive oil")).toMatchObject({
      quantity: 2.5,
      unit: "tablespoons",
      name: "olive oil",
    });
  });
});

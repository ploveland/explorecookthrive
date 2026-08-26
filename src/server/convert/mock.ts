import type { ConversionOutput } from "../ai/types";
import { parseIngredientLine } from "../recipes/parse-ingredient";
import type { ConvertRecipeInput, NutritionGoalId } from "./schema";

type ThriveIngredient = ConversionOutput["thriveVersion"]["ingredients"][number];
type Change = ConversionOutput["changes"][number];
type Keep = ConversionOutput["analysis"]["wouldNotChange"][number];
type DishKind =
  | "biscuits"
  | "carbonara"
  | "fried_chicken"
  | "chili"
  | "cake"
  | "chowder"
  | "sandwich"
  | "pasta"
  | "other";

function haystack(input: ConvertRecipeInput) {
  return `${input.title}\n${input.ingredients.map((item) => item.rawText).join("\n")}\n${input.instructions.join("\n")}`.toLowerCase();
}

function detectKind(input: ConvertRecipeInput): DishKind {
  const text = haystack(input);
  if (/biscuit/.test(text)) return "biscuits";
  if (/carbonara|guanciale/.test(text)) return "carbonara";
  if (/fried chicken/.test(text)) return "fried_chicken";
  if (/\bchili\b|\bchilli\b/.test(text)) return "chili";
  if (/\bcake\b/.test(text) && /cocoa|chocolate|sugar/.test(text)) return "cake";
  if (/chowder|bisque|\bcream soup\b/.test(text)) return "chowder";
  if (/muffuletta|po.?boy|sandwich/.test(text)) return "sandwich";
  if (/\bpasta\b|spaghetti|linguine|fettuccine|lasagna/.test(text)) return "pasta";
  return "other";
}

function wants(input: ConvertRecipeInput, goal: NutritionGoalId) {
  return input.goals.includes(goal);
}

function thriveFrom(
  item: ConvertRecipeInput["ingredients"][number],
  assumptionNote: string | null = null,
): ThriveIngredient {
  const parsed = parseIngredientLine(item.rawText);
  return {
    rawText: item.rawText,
    name: item.name ?? parsed.name ?? item.rawText,
    quantity: item.quantity ?? parsed.quantity,
    unit: item.unit ?? parsed.unit,
    preparation: item.preparation ?? parsed.preparation,
    assumptionNote,
  };
}

function fromRaw(rawText: string, assumptionNote: string | null = null): ThriveIngredient {
  const parsed = parseIngredientLine(rawText);
  return {
    rawText,
    name: parsed.name ?? rawText,
    quantity: parsed.quantity,
    unit: parsed.unit,
    preparation: parsed.preparation,
    assumptionNote,
  };
}

function looksLike(item: ThriveIngredient, pattern: RegExp) {
  return pattern.test(`${item.name} ${item.rawText}`.toLowerCase());
}

function originalIngredients(input: ConvertRecipeInput): ThriveIngredient[] {
  return input.ingredients.map((item) => thriveFrom(item));
}

function replaceMatching(
  ingredients: ThriveIngredient[],
  pattern: RegExp,
  replacement: ThriveIngredient | ThriveIngredient[],
): ThriveIngredient[] {
  let replaced = false;
  return ingredients.flatMap((item) => {
    if (!replaced && looksLike(item, pattern)) {
      replaced = true;
      return Array.isArray(replacement) ? replacement : [replacement];
    }
    return [item];
  });
}

function tasteImpactFor(
  preference: ConvertRecipeInput["preference"],
): ConversionOutput["analysis"]["tasteImpact"] {
  if (preference === "maximum") return "moderate";
  return "minimal";
}

function dietaryAssumptions(input: ConvertRecipeInput): string[] {
  const text = haystack(input);
  const notes: string[] = [];
  const animal = /egg|butter|milk|cheese|cream|yogurt|beef|pork|chicken|guanciale|pecorino|bacon|fish/.test(
    text,
  );
  const gluten = /flour|spaghetti|pasta|bread|biscuit/.test(text);
  const dairy = /butter|milk|cheese|cream|yogurt|buttermilk|pecorino/.test(text);

  if (input.dietary.includes("vegan") && animal) {
    notes.push(
      "A vegan take would be a different dish. We kept the ingredients that make this itself.",
    );
  } else if (
    input.dietary.includes("vegetarian") &&
    /beef|pork|chicken|guanciale|bacon|fish/.test(text)
  ) {
    notes.push(
      "Vegetarian would replace the protein that defines this dish, so we did not force that.",
    );
  }
  if (input.dietary.includes("gluten_free") && gluten) {
    notes.push(
      "A gluten-free structure needs a tested formula. We did not drop in a random blend.",
    );
  }
  if (input.dietary.includes("dairy_free") && dairy) {
    notes.push("Dairy is doing flavor or structure work here, so we left it.");
  }
  return notes;
}

function keepWhatMatters(input: ConvertRecipeInput, kind: DishKind): Keep[] {
  const text = haystack(input);
  const items: Keep[] = [];
  const keep = (item: string, reason: string) => {
    if (!items.some((entry) => entry.item.toLowerCase() === item.toLowerCase())) {
      items.push({ item, reason });
    }
  };

  if (kind === "biscuits" || /\bbutter\b/.test(text)) {
    keep("butter", "Cold butter is the flake, the browning, and the flavor.");
  }
  if (kind === "carbonara") {
    keep("egg yolks", "Yolks are the sauce.");
    keep("pecorino", "Pecorino is the salt and the body of the emulsion.");
    keep("guanciale", "Rendered guanciale is the savor.");
  }
  if (kind === "fried_chicken") {
    keep("flour", "Seasoned flour is the crust.");
    keep("buttermilk", "The soak seasons the meat and helps the crust cling.");
  }
  if (kind === "chili") {
    keep("chili powder", "The spice blend is the identity of the pot.");
    keep("beef", "Browned beef is the base.");
  }
  if (kind === "cake") {
    keep("sugar", "Sugar is moisture and structure in this batter, not just sweetness.");
    keep("cocoa", "Cocoa is the chocolate. It stays.");
  }
  if (kind === "chowder" && /cream|half-and-half/.test(text)) {
    keep("cream", "Some dairy fat is why chowder tastes like chowder.");
  }
  if (kind === "sandwich" && /bread|roll|loaf|muffuletta/.test(text)) {
    keep("bread", "The bread is the architecture.");
  }
  if (items.length === 0) {
    const first = input.ingredients[0];
    keep(
      first?.name ?? first?.rawText ?? "core ingredients",
      "The original ingredients stay unless a change below explains otherwise.",
    );
  }
  return items;
}

type Built = {
  ingredients: ThriveIngredient[];
  instructions: string[];
  changes: Change[];
};

function forKind(input: ConvertRecipeInput, kind: DishKind): Built {
  let ingredients = originalIngredients(input);
  const changes: Change[] = [];
  let instructions: string[] = input.instructions.map((step) => step.trim()).filter(Boolean);

  if (kind === "biscuits") {
    if (wants(input, "more_fiber") || wants(input, "healthier_overall")) {
      ingredients = replaceMatching(ingredients, /all-purpose flour|^flour$|\bflour\b/, [
        fromRaw("1 1/2 cups all-purpose flour", "Most of the original two cups."),
        fromRaw("1/2 cup white whole wheat flour", "Used for part of the all-purpose flour."),
      ]);
      changes.push({
        original: "All all-purpose flour",
        suggested: "Use some white whole wheat flour in the mix",
        nutritionReason: "Adds fiber without a heavy wheat flavor.",
        flavorEffect: "Still a buttermilk biscuit, with a faint nuttiness.",
        textureEffect: "Keep the butter cold so the flake survives the second flour.",
      });
    }
    changes.push({
      original: "Scooping flour by volume",
      suggested: "Weigh about 240g flour total so an extra quarter-cup does not sneak in",
      nutritionReason: "A packed cup of flour quietly adds starch.",
      flavorEffect: "The buttermilk and butter still lead.",
      textureEffect: "Still tender and flaky, a little less dense.",
    });
    instructions = [
      "Weigh the flours (about 240g total) and whisk with baking powder and salt.",
      "Cut cold butter into the flour until the pieces are pea-sized. Keep the butter in cold shards.",
      "Stir in buttermilk, fold, cut, and bake hot.",
    ];
  }

  if (kind === "carbonara") {
    ingredients = [...ingredients, fromRaw("1/2 cup reserved pasta water", "Starchy water from the pasta pot.")];
    changes.push({
      original: "Sauce made only from yolks and cheese",
      suggested: "Loosen the emulsion with pasta water off the heat",
      nutritionReason: "The noodles coat with less cheese when the water helps it silk.",
      flavorEffect: "Still egg, pecorino, pepper, and guanciale.",
      textureEffect: "Glossier sauce that clings instead of clumping.",
    });
    instructions = [
      "Render the guanciale until the fat runs and the edges crisp.",
      "Cook the spaghetti in salted water. Reserve 1/2 cup pasta water, then drain.",
      "Toss the hot pasta with yolks, pecorino, black pepper, and pasta water off the heat until the sauce silks. Do not scramble the eggs.",
    ];
  }

  if (kind === "fried_chicken") {
    changes.push({
      original: "Frying without watching oil temperature",
      suggested: "Hold the oil at a steady fry temperature and drain on a rack",
      nutritionReason: "Oil that is too cool soaks the crust; a rack sheds extra fat.",
      flavorEffect: "Seasoned crust and buttermilk soak still lead.",
      textureEffect: "Crisp, not greasy. The crust stays.",
    });
    instructions = [
      "Soak the chicken in buttermilk.",
      "Dredge in seasoned flour.",
      "Fry in oil held around 325–350°F until the crust is deep gold and the meat is cooked through.",
      "Drain on a rack, not a piled plate, so extra fat runs off and the crust stays crisp.",
    ];
  }

  if (kind === "chili") {
    if (
      wants(input, "more_fiber") ||
      wants(input, "higher_protein") ||
      wants(input, "healthier_overall")
    ) {
      ingredients = replaceMatching(
        ingredients,
        /ground beef|\bbeef\b/,
        fromRaw("12 ounces ground beef", "A little less meat so the beans can do more work."),
      );
      ingredients = [
        ...ingredients,
        fromRaw("1 can black beans, drained", "A second bean that already belongs in chili."),
      ];
      changes.push({
        original: "A full pound of beef and one can of beans",
        suggested: "Use 12 ounces of beef and add black beans alongside the kidney beans",
        nutritionReason: "More fiber and protein in a pot that already knows beans, without a heavier meat load.",
        flavorEffect: "Still chili-powder forward, with a little more earthiness.",
        textureEffect: "Heartier spoonfuls, same simmer.",
      });
    }
    ingredients = [
      ...ingredients,
      fromRaw("1 bell pepper, diced", "A supporting vegetable, not a replacement for beef."),
    ];
    changes.push({
      original: "Beef, onion, and tomatoes only",
      suggested: "Sweat a bell pepper with the onion",
      nutritionReason: "Adds volume and a little fiber without muting the spice.",
      flavorEffect: "Sweet pepper in the background. Chili powder still leads.",
      textureEffect: "Same stew, a bit more vegetation in the bite.",
    });
    instructions = [
      "Brown the beef well with the onion and bell pepper.",
      "Stir in chili powder and garlic until fragrant.",
      "Add tomatoes and both beans. Simmer until the fat and spices marry.",
    ];
  }

  if (kind === "cake") {
    ingredients = replaceMatching(
      ingredients,
      /\bsugar\b/,
      fromRaw("1 3/4 cups sugar", "A modest cut from a packed 2 cups. Sugar still builds the crumb."),
    );
    ingredients = [
      ...ingredients,
      fromRaw("1 teaspoon espresso powder", "Deepens cocoa; it should not taste like coffee dessert."),
    ];
    changes.push({
      original: "The full packed measure of sugar as the only lever",
      suggested:
        "Use a modestly lighter measure of sugar and bloom the cocoa with espresso powder",
      nutritionReason: "A small sugar cut lowers added sugar without collapsing the crumb.",
      flavorEffect: "Chocolate stays loud.",
      textureEffect: "Still a layer cake, not a rubbery sponge.",
    });
    instructions = [
      "Bloom the cocoa with hot liquid and espresso powder.",
      "Cream, mix, and bake in two pans. Do not overbake.",
      "Cool and frost.",
    ];
  }

  if (kind === "chowder") {
    const hadCream = ingredients.some((item) => looksLike(item, /heavy cream|whipping cream|half-and-half|\bcream\b/));
    if (hadCream) {
      ingredients = replaceMatching(ingredients, /heavy cream|whipping cream|half-and-half|\bcream\b/, [
        fromRaw("1/2 cup heavy cream", "Enough dairy fat so it still tastes like chowder."),
        fromRaw("1 cup whole milk or seafood stock", "Carries the simmer so the pot is not all cream."),
      ]);
      changes.push({
        original: "Cream as most of the liquid",
        suggested: "Simmer in stock or milk and finish with a smaller pour of cream",
        nutritionReason: "Keeps the lush finish without using cream as the whole broth.",
        flavorEffect: "Still a cream chowder. The seafood and aromatics stay in front.",
        textureEffect: "Silky, not gluey. The potatoes or crackers still thicken it.",
      });
    }
    changes.push({
      original: "Salt added from habit",
      suggested: "Measure the salt and finish with lemon or the cooking liquor from the seafood",
      nutritionReason: "Chowder gets salty fast from clams, stock, and dairy.",
      flavorEffect: "The dish should taste briny and sweet, not like a salt lick.",
      textureEffect: "No change to the body of the soup.",
    });
    instructions = [
      "Sweat the onion and celery in the butter until they smell sweet. Do not brown them hard.",
      "Build the soup in stock or milk with the potatoes and seafood.",
      "Finish with the cream off a hard boil. Taste, then add a measured pinch of salt and a squeeze of lemon if it needs lift.",
    ];
  }

  if (kind === "sandwich") {
    if (wants(input, "lower_calories") || wants(input, "lower_sodium") || wants(input, "healthier_overall")) {
      ingredients = ingredients.map((item) => {
        if (!looksLike(item, /salami|mortadella|ham|capicola|cured|prosciutto/)) return item;
        return fromRaw(
          `${item.rawText} (about three-quarters of a thick deli stack)`,
          "Keep the meats that make this sandwich. Use a slightly thinner layer.",
        );
      });
      changes.push({
        original: "A piled stack of cured meats",
        suggested: "Keep every signature meat, in a slightly thinner layer",
        nutritionReason: "Cured meats carry salt and fat. A little less still tastes like the sandwich.",
        flavorEffect: "Olive salad, bread, and the mixed meats still lead.",
        textureEffect: "Easier to bite. The bread does not collapse.",
      });
    }
    changes.push({
      original: "The filling as an afterthought to the bread",
      suggested: "Keep the olive salad or pickle relish generous; that is the flavor architecture",
      nutritionReason: "Acid and herbs season the sandwich so you need less meat for the same punch.",
      flavorEffect: "Still the original sandwich, not a diet wrap.",
      textureEffect: "Juicy, not soggy, if you do not soak the bread overnight unless the original does.",
    });
    instructions = [
      "Keep the bread and the signature condiment (olive salad, giardiniera, or slaw) as written.",
      "Layer the meats a little thinner than a deli pile, then close the sandwich so it still eats like itself.",
    ];
  }

  if (kind === "pasta") {
    ingredients = [
      ...ingredients,
      fromRaw("1/2 cup reserved pasta water", "Starchy water from the pasta pot."),
    ];
    changes.push({
      original: "Sauce finished in the pan with extra fat or cheese to make it cling",
      suggested: "Finish the pasta in the sauce with pasta water off a hard boil",
      nutritionReason: "Starch helps the sauce coat, so you need less extra fat or cheese.",
      flavorEffect: "The original sauce still leads.",
      textureEffect: "Glossy noodles, not a slick of oil in the bowl.",
    });
    instructions = [
      "Cook the pasta in well-salted water. Reserve 1/2 cup pasta water.",
      "Finish the noodles in the sauce with pasta water until they are coated. Serve at once.",
    ];
  }

  return { ingredients, instructions, changes };
}

function genericMoves(input: ConvertRecipeInput): Built {
  let ingredients = originalIngredients(input);
  const changes: Change[] = [];
  const text = haystack(input);

  if (/flour/.test(text)) {
    changes.push({
      original: "Flour measured by a packed cup",
      suggested: "Weigh the flour",
      nutritionReason: "Stops extra starch from sneaking in.",
      flavorEffect: "The original flavors stay in charge.",
      textureEffect: "A little less dense, same crumb intent.",
    });
  }

  if (wants(input, "lower_sodium") || /\bsalt\b/.test(text)) {
    ingredients = ingredients.map((item) => {
      if (!looksLike(item, /\bsalt\b|kosher salt|sea salt/)) return item;
      return fromRaw(item.rawText, "Measure this. Taste before you add another pinch.");
    });
    changes.push({
      original: "Salt added from habit",
      suggested: "Measure the salt and finish with acid or herbs if it needs lift",
      nutritionReason: "Sodium drops when salt is measured instead of poured.",
      flavorEffect: "The dish should taste seasoned, not briny.",
      textureEffect: "No change to structure.",
    });
  }

  if (
    (wants(input, "lower_calories") || wants(input, "lower_saturated_fat")) &&
    /oil|fry|butter/.test(text)
  ) {
    changes.push({
      original: "Fat used without attention to how much actually stays in the food",
      suggested: "Measure the cooking fat and drain what the food does not need",
      nutritionReason: "You keep the flavor from fat without eating every spare gram.",
      flavorEffect: "Browning and aroma stay.",
      textureEffect: "Crisp or silky where it should be, not sodden.",
    });
  }

  if (wants(input, "lower_added_sugar") && /sugar/.test(text)) {
    ingredients = replaceMatching(
      ingredients,
      /\bsugar\b/,
      fromRaw(
        ingredients.find((item) => looksLike(item, /\bsugar\b/))?.rawText ?? "sugar, slightly less than a packed cup",
        "A slightly lighter measure where sugar is not holding the crumb up.",
      ),
    );
    changes.push({
      original: "Sugar as a packed, unexamined cup",
      suggested: "Use a slightly lighter measure of sugar where it is not holding the crumb up",
      nutritionReason: "Cuts added sugar without replacing it with a novelty sweetener.",
      flavorEffect: "The original flavors can read more clearly.",
      textureEffect: "Keep enough sugar for moisture and browning.",
    });
  }

  if (changes.length === 0) {
    changes.push({
      original: "Aromatics cooked on autopilot",
      suggested: "Sweat onion, garlic, or spices until they smell like the dish before the main protein goes in",
      nutritionReason: "Better extraction of flavor means you reach less for extra salt and fat.",
      flavorEffect: "The original still tastes like itself, just more clearly.",
      textureEffect: "Texture stays on purpose.",
    });
  }

  const instructions = [
    ...changes.map((change) => change.suggested.replace(/^\w/, (letter) => letter.toUpperCase()) + "."),
    ...input.instructions.map((step) => step.trim()).filter(Boolean),
  ];

  return { ingredients, instructions, changes };
}

export function mockConvert(input: ConvertRecipeInput): ConversionOutput {
  const kind = detectKind(input);
  const built = kind === "other" ? genericMoves(input) : forKind(input, kind);
  const wouldNotChange = keepWhatMatters(input, kind);
  const suffix =
    input.preference === "preserve"
      ? "lightly tuned"
      : input.preference === "maximum"
        ? "pushed a little further"
        : "thrived";

  return {
    analysis: {
      flavorDrivers: wouldNotChange.map((entry) => entry.item),
      textureDrivers:
        kind === "fried_chicken"
          ? ["crisp seasoned crust"]
          : kind === "biscuits"
            ? ["cold butter shards"]
            : kind === "carbonara"
              ? ["yolk and cheese emulsion"]
              : ["the original method"],
      structureDrivers:
        kind === "cake"
          ? ["sugar, eggs, and gluten"]
          : kind === "biscuits"
            ? ["steam from butter and gluten"]
            : ["the original structure"],
      highImpactOpportunities: built.changes.map((change) => change.suggested),
      wouldNotChange,
      tasteImpact: tasteImpactFor(input.preference),
      assumptions: [
        ...dietaryAssumptions(input),
        "Nutrition numbers are not guessed here. USDA estimates are attached after conversion.",
      ],
    },
    thriveVersion: {
      title: `${input.title}, ${suffix}`,
      description: `A Thrive Version of ${input.title} that keeps what makes it itself and only changes what we can defend.`,
      servings: input.servings && input.servings > 0 ? input.servings : 4,
      prepMinutes: input.prepMinutes,
      cookMinutes: input.cookMinutes,
      ingredients: built.ingredients,
      instructions: built.instructions,
    },
    changes: built.changes,
  };
}

import type { ConversionOutput } from "../ai/types";
import { parseIngredientLine } from "../recipes/parse-ingredient";
import type { ConvertRecipeInput, NutritionGoalId } from "./schema";

type ThriveIngredient = ConversionOutput["thriveVersion"]["ingredients"][number];
type Change = ConversionOutput["changes"][number];
type Keep = ConversionOutput["analysis"]["wouldNotChange"][number];
type DishKind = "biscuits" | "carbonara" | "fried_chicken" | "chili" | "cake" | "other";

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

function added(rawText: string, assumptionNote: string): ThriveIngredient {
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
  if (items.length === 0) {
    const first = input.ingredients[0];
    keep(
      first?.name ?? first?.rawText ?? "core ingredients",
      "The original ingredients stay unless a change below explains otherwise.",
    );
  }
  return items;
}

function forKind(
  input: ConvertRecipeInput,
  kind: DishKind,
): { extras: ThriveIngredient[]; changes: Change[]; steps: string[] } {
  const extras: ThriveIngredient[] = [];
  const changes: Change[] = [];
  const steps: string[] = [];

  if (kind === "biscuits") {
    changes.push({
      original: "Scooping flour by volume",
      suggested: "Weigh 240g flour so an extra quarter-cup does not sneak in",
      nutritionReason: "A packed cup of flour quietly adds starch.",
      flavorEffect: "The buttermilk and butter still lead.",
      textureEffect: "Still tender and flaky, a little less dense.",
    });
    if (wants(input, "more_fiber") || wants(input, "healthier_overall")) {
      extras.push(
        added("1/2 cup white whole wheat flour", "Used for part of the all-purpose flour."),
      );
      changes.push({
        original: "All all-purpose flour",
        suggested: "Use some white whole wheat flour in the mix",
        nutritionReason: "Adds fiber without a heavy wheat flavor.",
        flavorEffect: "Still a buttermilk biscuit, with a faint nuttiness.",
        textureEffect: "Keep the butter cold so the flake survives the second flour.",
      });
    }
    steps.push("Weigh the flour. Keep the butter in cold shards.");
  }

  if (kind === "carbonara") {
    extras.push(added("1/2 cup pasta water", "Starchy cooking water, reserved from the pot."));
    changes.push({
      original: "Sauce made only from yolks and cheese",
      suggested: "Loosen the emulsion with pasta water off the heat",
      nutritionReason: "The noodles coat with less cheese when the water helps it silk.",
      flavorEffect: "Still egg, pecorino, pepper, and guanciale.",
      textureEffect: "Glossier sauce that clings instead of clumping.",
    });
    steps.push("Reserve pasta water. Toss off the heat so the yolks do not scramble.");
  }

  if (kind === "fried_chicken") {
    extras.push(added("1 instant-read thermometer", "For oil temperature, not part of the crust."));
    changes.push({
      original: "Frying without watching oil temperature",
      suggested: "Hold the oil at a steady fry temperature and drain on a rack",
      nutritionReason: "Oil that is too cool soaks the crust; a rack sheds extra fat.",
      flavorEffect: "Seasoned crust and buttermilk soak still lead.",
      textureEffect: "Crisp, not greasy. The crust stays.",
    });
    steps.push("Fry at a steady temperature. Drain on a rack, not a piled plate.");
  }

  if (kind === "chili") {
    if (
      wants(input, "more_fiber") ||
      wants(input, "higher_protein") ||
      wants(input, "healthier_overall")
    ) {
      extras.push(added("1 can black beans, drained", "A second bean that already belongs in chili."));
      changes.push({
        original: "One can of beans",
        suggested: "Add black beans alongside the kidney beans",
        nutritionReason: "More fiber and protein in a pot that already knows beans.",
        flavorEffect: "Still chili-powder forward, with a little more earthiness.",
        textureEffect: "Heartier spoonfuls, same simmer.",
      });
    }
    extras.push(added("1 bell pepper, diced", "A supporting vegetable, not a replacement for beef."));
    changes.push({
      original: "Beef, onion, and tomatoes only",
      suggested: "Sweat a bell pepper with the onion",
      nutritionReason: "Adds volume and a little fiber without muting the spice.",
      flavorEffect: "Sweet pepper in the background. Chili powder still leads.",
      textureEffect: "Same stew, a bit more vegetation in the bite.",
    });
    steps.push("Brown the beef well. Simmer until the fat and spices marry.");
  }

  if (kind === "cake") {
    extras.push(
      added("1 teaspoon espresso powder", "Deepens cocoa; it should not taste like coffee dessert."),
    );
    changes.push({
      original: "The full packed measure of sugar as the only lever",
      suggested:
        "Use a modestly lighter measure of sugar and bloom the cocoa with espresso powder",
      nutritionReason: "A small sugar cut lowers added sugar without collapsing the crumb.",
      flavorEffect: "Chocolate stays loud.",
      textureEffect: "Still a layer cake, not a rubbery sponge.",
    });
    steps.push("Bloom cocoa with hot liquid. Do not overbake.");
  }

  return { extras, changes, steps };
}

function genericMoves(input: ConvertRecipeInput): {
  extras: ThriveIngredient[];
  changes: Change[];
  steps: string[];
} {
  const extras: ThriveIngredient[] = [];
  const changes: Change[] = [];
  const steps: string[] = [];
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
      original: "Cooking from habit",
      suggested: "Taste as you go and keep the technique that already works",
      nutritionReason: "The highest-impact move is not adding extra the dish does not need.",
      flavorEffect: "The original still tastes like itself.",
      textureEffect: "Texture stays on purpose.",
    });
    steps.push("Cook the original method. Taste before you add more salt or fat.");
  }

  return { extras, changes, steps };
}

export function mockConvert(input: ConvertRecipeInput): ConversionOutput {
  const kind = detectKind(input);
  const specific = kind === "other" ? genericMoves(input) : forKind(input, kind);
  const fallback = kind === "other" ? { extras: [], changes: [], steps: [] } : genericMoves(input);

  const extras = [...specific.extras];
  const changes = specific.changes.length > 0 ? [...specific.changes] : [...fallback.changes];
  const extraSteps = specific.steps.length > 0 ? [...specific.steps] : [...fallback.steps];
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
      highImpactOpportunities: changes.map((change) => change.suggested),
      wouldNotChange,
      tasteImpact: tasteImpactFor(input.preference),
      assumptions: [
        ...dietaryAssumptions(input),
        "Nutrition numbers are not guessed here. USDA estimates come in a later step.",
      ],
    },
    thriveVersion: {
      title: `${input.title}, ${suffix}`,
      description: `A Thrive Version of ${input.title} that keeps what makes it itself and only changes what we can defend.`,
      servings: input.servings && input.servings > 0 ? input.servings : 4,
      prepMinutes: input.prepMinutes,
      cookMinutes: input.cookMinutes,
      ingredients: [...input.ingredients.map((item) => thriveFrom(item)), ...extras],
      instructions: [...input.instructions.map((step) => step.trim()), ...extraSteps.filter(Boolean)],
    },
    changes,
  };
}

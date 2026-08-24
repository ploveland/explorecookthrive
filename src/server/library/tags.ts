import { TAXONOMY_TAGS } from "../taxonomy/tags";
import type { DietaryRequirementId, NutritionGoalId } from "../convert/schema";

const GOAL_TAGS: Record<NutritionGoalId, string | null> = {
  healthier_overall: null,
  lower_calories: "lower-calories",
  higher_protein: "higher-protein",
  more_fiber: "more-fiber",
  lower_saturated_fat: "lower-saturated-fat",
  lower_sodium: "lower-sodium",
  lower_added_sugar: "lower-added-sugar",
};

const DIETARY_TAGS: Record<DietaryRequirementId, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  gluten_free: "gluten-free",
  dairy_free: "dairy-free",
};

const known = new Set(TAXONOMY_TAGS.map((tag) => tag.slug));

function add(tags: Set<string>, slug: string | null | undefined) {
  if (slug && known.has(slug)) tags.add(slug);
}

export function assignLibraryTags(input: {
  title: string;
  originalTitle: string;
  description: string;
  cuisine: string | null;
  category: string | null;
  instructions: string[];
  prepMinutes: number | null;
  cookMinutes: number | null;
  goals: NutritionGoalId[];
  dietary: DietaryRequirementId[];
}): string[] {
  const tags = new Set<string>();
  const blob = `${input.title} ${input.originalTitle} ${input.description} ${input.instructions.join(" ")}`.toLowerCase();
  const minutes = (input.prepMinutes ?? 0) + (input.cookMinutes ?? 0);

  for (const goal of input.goals) add(tags, GOAL_TAGS[goal]);
  for (const item of input.dietary) add(tags, DIETARY_TAGS[item]);

  const cuisine = input.cuisine?.toLowerCase().replace(/\s+/g, "-") ?? "";
  add(tags, cuisine);
  if (cuisine.includes("south")) add(tags, "southern");
  if (cuisine.includes("ital")) add(tags, "italian");
  if (cuisine.includes("mex")) add(tags, "mexican");
  if (cuisine.includes("indian")) add(tags, "indian");

  const category = input.category?.toLowerCase() ?? "";
  if (/breakfast|brunch/.test(category) || /pancake|waffle|omelet|biscuit/.test(blob)) add(tags, "breakfast");
  if (/lunch/.test(category)) add(tags, "lunch");
  if (/dinner|entree|main/.test(category) || /chili|chicken|pasta|steak/.test(blob)) add(tags, "dinner");
  if (/dessert|cake|cookie|brownie/.test(`${category} ${blob}`)) add(tags, "dessert");
  if (/snack/.test(category)) add(tags, "snack");

  if (minutes > 0 && minutes <= 45) add(tags, "weeknight");
  if (/sheet[- ]?pan/.test(blob)) add(tags, "sheet-pan");
  if (/one[- ]?pan|skillet/.test(blob)) add(tags, "one-pan");
  if (/slow cooker|crockpot/.test(blob)) add(tags, "slow-cooker");
  if (/grill/.test(blob)) add(tags, "grill");
  if (/bake|oven|batter|dough/.test(blob)) add(tags, "bake");
  if (/simmer|saute|sauté|stovetop|brown the/.test(blob)) add(tags, "stovetop");

  if (/fried chicken|biscuit|mac and cheese|chili|carbonara|cake|cookie|brownie/.test(blob)) {
    add(tags, "comfort-food");
  }
  if (/cake|cookie|biscuit|bread|muffin|flour/.test(blob)) add(tags, "better-baking");

  return [...tags];
}

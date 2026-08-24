import type { TagType } from "@prisma/client";

export type TaxonomyTag = {
  slug: string;
  name: string;
  type: TagType;
};

export const TAXONOMY_TAGS: TaxonomyTag[] = [
  { slug: "breakfast", name: "Breakfast", type: "MEAL" },
  { slug: "lunch", name: "Lunch", type: "MEAL" },
  { slug: "dinner", name: "Dinner", type: "MEAL" },
  { slug: "snack", name: "Snack", type: "MEAL" },
  { slug: "dessert", name: "Dessert", type: "MEAL" },

  { slug: "american", name: "American", type: "CUISINE" },
  { slug: "italian", name: "Italian", type: "CUISINE" },
  { slug: "mexican", name: "Mexican", type: "CUISINE" },
  { slug: "southern", name: "Southern", type: "CUISINE" },
  { slug: "mediterranean", name: "Mediterranean", type: "CUISINE" },
  { slug: "indian", name: "Indian", type: "CUISINE" },
  { slug: "east-asian", name: "East Asian", type: "CUISINE" },
  { slug: "middle-eastern", name: "Middle Eastern", type: "CUISINE" },

  { slug: "higher-protein", name: "Higher protein", type: "NUTRITION_GOAL" },
  { slug: "more-fiber", name: "More fiber", type: "NUTRITION_GOAL" },
  { slug: "lower-calories", name: "Lower calories", type: "NUTRITION_GOAL" },
  { slug: "lower-sodium", name: "Lower sodium", type: "NUTRITION_GOAL" },
  { slug: "lower-saturated-fat", name: "Lower saturated fat", type: "NUTRITION_GOAL" },
  { slug: "lower-added-sugar", name: "Lower added sugar", type: "NUTRITION_GOAL" },

  { slug: "weeknight", name: "Weeknight", type: "COOKING_STYLE" },
  { slug: "one-pan", name: "One pan", type: "COOKING_STYLE" },
  { slug: "sheet-pan", name: "Sheet pan", type: "COOKING_STYLE" },
  { slug: "slow-cooker", name: "Slow cooker", type: "COOKING_STYLE" },
  { slug: "grill", name: "Grill", type: "COOKING_STYLE" },
  { slug: "bake", name: "Bake", type: "COOKING_STYLE" },
  { slug: "stovetop", name: "Stovetop", type: "COOKING_STYLE" },

  { slug: "vegetarian", name: "Vegetarian", type: "DIETARY" },
  { slug: "vegan", name: "Vegan", type: "DIETARY" },
  { slug: "gluten-free", name: "Gluten-free", type: "DIETARY" },
  { slug: "dairy-free", name: "Dairy-free", type: "DIETARY" },

  { slug: "comfort-food", name: "Comfort food", type: "COLLECTION_THEME" },
  { slug: "better-baking", name: "Better baking", type: "COLLECTION_THEME" },
  { slug: "family-friendly", name: "Family friendly", type: "COLLECTION_THEME" },
  { slug: "meal-prep", name: "Meal prep", type: "COLLECTION_THEME" },
  { slug: "budget-friendly", name: "Budget friendly", type: "COLLECTION_THEME" },
  { slug: "recently-thrived", name: "Recently Thrived", type: "COLLECTION_THEME" },
];

export const TAG_TYPES: TagType[] = [
  "MEAL",
  "CUISINE",
  "NUTRITION_GOAL",
  "COOKING_STYLE",
  "DIETARY",
  "COLLECTION_THEME",
];

import { type NutrientTotals } from "./schema";

export type CatalogFood = {
  id: string;
  fdcId: number;
  description: string;
  aliases: string[];
  per100g: NutrientTotals;
  densityGPerMl?: number;
  cupGrams?: number;
  tbspGrams?: number;
  tspGrams?: number;
  pieceGrams?: number;
  cloveGrams?: number;
  stickGrams?: number;
  canGrams?: number;
  sliceGrams?: number;
  bunchGrams?: number;
};

function n(
  calories: number,
  proteinG: number,
  fatG: number,
  saturatedFatG: number,
  carbsG: number,
  fiberG: number,
  sugarG: number,
  sodiumMg: number,
): NutrientTotals {
  return { calories, proteinG, fatG, saturatedFatG, carbsG, fiberG, sugarG, sodiumMg };
}

/** Typical USDA SR Legacy / Foundation values per 100g. Used when no live FDC key is set. */
export const CATALOG: CatalogFood[] = [
  {
    id: "butter",
    fdcId: 173410,
    description: "Butter, unsalted",
    aliases: ["butter", "unsalted butter", "salted butter", "cold butter"],
    per100g: n(717, 0.9, 81.1, 51.4, 0.1, 0, 0.1, 11),
    cupGrams: 227,
    tbspGrams: 14.2,
    stickGrams: 113,
  },
  {
    id: "flour-ap",
    fdcId: 169761,
    description: "Wheat flour, white, all-purpose",
    aliases: ["all-purpose flour", "all purpose flour", "ap flour", "flour", "plain flour"],
    per100g: n(364, 10.3, 1.0, 0.2, 76.3, 2.7, 0.3, 2),
    cupGrams: 120,
  },
  {
    id: "flour-www",
    fdcId: 168915,
    description: "Wheat flour, white whole-wheat",
    aliases: ["white whole wheat flour", "white whole-wheat flour", "whole wheat flour", "whole-wheat flour"],
    per100g: n(340, 13.2, 2.5, 0.4, 72, 10.7, 0.4, 2),
    cupGrams: 120,
  },
  {
    id: "sugar",
    fdcId: 169655,
    description: "Sugars, granulated",
    aliases: ["sugar", "granulated sugar", "white sugar", "cane sugar"],
    per100g: n(387, 0, 0, 0, 99.98, 0, 99.8, 1),
    cupGrams: 200,
    tbspGrams: 12.5,
  },
  {
    id: "brown-sugar",
    fdcId: 168833,
    description: "Sugars, brown",
    aliases: ["brown sugar", "light brown sugar", "dark brown sugar"],
    per100g: n(380, 0.1, 0, 0, 98.1, 0, 97, 28),
    cupGrams: 220,
  },
  {
    id: "buttermilk",
    fdcId: 170874,
    description: "Buttermilk, low fat",
    aliases: ["buttermilk"],
    per100g: n(40, 3.3, 0.9, 0.6, 4.8, 0, 4.8, 157),
    cupGrams: 245,
    densityGPerMl: 1.03,
  },
  {
    id: "milk",
    fdcId: 173441,
    description: "Milk, whole, 3.25% milkfat",
    aliases: ["milk", "whole milk"],
    per100g: n(61, 3.2, 3.3, 1.9, 4.8, 0, 5.1, 43),
    cupGrams: 244,
    densityGPerMl: 1.03,
  },
  {
    id: "egg",
    fdcId: 171287,
    description: "Egg, whole, raw",
    aliases: ["egg", "eggs", "large egg", "large eggs"],
    per100g: n(143, 12.6, 9.5, 3.1, 0.7, 0, 0.4, 142),
    pieceGrams: 50,
  },
  {
    id: "egg-yolk",
    fdcId: 173418,
    description: "Egg, yolk, raw",
    aliases: ["egg yolk", "egg yolks", "yolk", "yolks"],
    per100g: n(322, 15.9, 26.5, 9.6, 3.6, 0, 0.6, 48),
    pieceGrams: 17,
  },
  {
    id: "salt",
    fdcId: 173468,
    description: "Salt, table",
    aliases: ["salt", "kosher salt", "sea salt", "table salt"],
    per100g: n(0, 0, 0, 0, 0, 0, 0, 38758),
    tspGrams: 6,
    cupGrams: 292,
  },
  {
    id: "baking-powder",
    fdcId: 172803,
    description: "Leavening agents, baking powder",
    aliases: ["baking powder"],
    per100g: n(53, 0.1, 0, 0, 27.7, 0.2, 0, 7893),
    tspGrams: 4.6,
  },
  {
    id: "baking-soda",
    fdcId: 173580,
    description: "Leavening agents, baking soda",
    aliases: ["baking soda", "bicarbonate of soda"],
    per100g: n(0, 0, 0, 0, 0, 0, 0, 27360),
    tspGrams: 4.6,
  },
  {
    id: "olive-oil",
    fdcId: 171413,
    description: "Oil, olive, salad or cooking",
    aliases: ["olive oil", "extra virgin olive oil", "extra-virgin olive oil"],
    per100g: n(884, 0, 100, 13.8, 0, 0, 0, 2),
    tbspGrams: 13.5,
    cupGrams: 216,
    densityGPerMl: 0.91,
  },
  {
    id: "vegetable-oil",
    fdcId: 171427,
    description: "Oil, soybean, salad or cooking",
    aliases: ["vegetable oil", "neutral oil", "canola oil", "frying oil", "oil"],
    per100g: n(884, 0, 100, 7.5, 0, 0, 0, 0),
    tbspGrams: 13.6,
    cupGrams: 218,
    densityGPerMl: 0.92,
  },
  {
    id: "spaghetti",
    fdcId: 168928,
    description: "Pasta, dry, enriched",
    aliases: ["spaghetti", "pasta", "noodles", "bucatini", "linguine"],
    per100g: n(371, 13, 1.5, 0.3, 74.7, 3.2, 2.7, 6),
    cupGrams: 91,
  },
  {
    id: "guanciale",
    fdcId: 168277,
    description: "Pork, cured, bacon, raw",
    aliases: ["guanciale", "pancetta", "bacon"],
    per100g: n(417, 12.5, 39.7, 13.3, 1.4, 0, 0, 662),
    sliceGrams: 8,
  },
  {
    id: "pecorino",
    fdcId: 170843,
    description: "Cheese, parmesan, hard",
    aliases: ["pecorino", "pecorino romano", "parmesan", "parmigiano", "parmigiano-reggiano"],
    per100g: n(392, 35.8, 25.8, 16.4, 3.2, 0, 0.8, 1376),
    cupGrams: 100,
  },
  {
    id: "black-pepper",
    fdcId: 170931,
    description: "Spices, pepper, black",
    aliases: ["black pepper", "pepper", "freshly ground pepper", "black peppercorns"],
    per100g: n(251, 10.4, 3.3, 1.4, 63.9, 25.3, 0.6, 20),
    tspGrams: 2.3,
  },
  {
    id: "pasta-water",
    fdcId: 173420,
    description: "Water, tap",
    aliases: ["pasta water", "starchy pasta water", "cooking water", "water"],
    per100g: n(0, 0, 0, 0, 0, 0, 0, 4),
    cupGrams: 240,
    densityGPerMl: 1,
  },
  {
    id: "chicken",
    fdcId: 171077,
    description: "Chicken, broilers or fryers, raw",
    aliases: ["chicken", "chicken pieces", "bone-in chicken", "chicken thighs", "chicken breast", "fried chicken"],
    per100g: n(215, 18.6, 15.1, 4.3, 0, 0, 0, 70),
    pieceGrams: 170,
  },
  {
    id: "paprika",
    fdcId: 171323,
    description: "Spices, paprika",
    aliases: ["paprika", "smoked paprika"],
    per100g: n(282, 14.1, 12.9, 2.1, 53.9, 34.9, 10.3, 68),
    tspGrams: 2.3,
  },
  {
    id: "garlic-powder",
    fdcId: 171322,
    description: "Spices, garlic powder",
    aliases: ["garlic powder"],
    per100g: n(331, 16.6, 0.7, 0.2, 72.7, 9, 2.4, 60),
    tspGrams: 3.1,
  },
  {
    id: "beef",
    fdcId: 174036,
    description: "Beef, ground, 80% lean, raw",
    aliases: ["ground beef", "beef", "minced beef", "chuck"],
    per100g: n(254, 17.2, 20, 7.6, 0, 0, 0, 66),
  },
  {
    id: "onion",
    fdcId: 170000,
    description: "Onions, raw",
    aliases: ["onion", "onions", "yellow onion", "white onion"],
    per100g: n(40, 1.1, 0.1, 0, 9.3, 1.7, 4.2, 4),
    pieceGrams: 110,
    cupGrams: 160,
  },
  {
    id: "garlic",
    fdcId: 169230,
    description: "Garlic, raw",
    aliases: ["garlic", "garlic clove", "garlic cloves"],
    per100g: n(149, 6.4, 0.5, 0.1, 33.1, 2.1, 1, 17),
    cloveGrams: 3,
    pieceGrams: 3,
  },
  {
    id: "chili-powder",
    fdcId: 171319,
    description: "Spices, chili powder",
    aliases: ["chili powder", "chilli powder"],
    per100g: n(282, 13.5, 14.3, 2.5, 49.7, 34.8, 7.2, 2867),
    tbspGrams: 8,
    tspGrams: 2.7,
  },
  {
    id: "cumin",
    fdcId: 170923,
    description: "Spices, cumin seed",
    aliases: ["cumin", "ground cumin", "cumin seed"],
    per100g: n(375, 17.8, 22.3, 1.5, 44.2, 10.5, 2.3, 168),
    tspGrams: 2.1,
  },
  {
    id: "kidney-beans",
    fdcId: 173746,
    description: "Beans, kidney, red, canned",
    aliases: ["kidney beans", "red kidney beans", "can kidney beans"],
    per100g: n(81, 5.2, 0.5, 0.1, 14.8, 6, 1.8, 241),
    canGrams: 250,
    cupGrams: 256,
  },
  {
    id: "black-beans",
    fdcId: 175189,
    description: "Beans, black, canned",
    aliases: ["black beans", "canned black beans"],
    per100g: n(91, 6, 0.3, 0.1, 16.6, 6.9, 0.2, 385),
    canGrams: 250,
    cupGrams: 240,
  },
  {
    id: "crushed-tomato",
    fdcId: 170051,
    description: "Tomatoes, crushed, canned",
    aliases: ["crushed tomatoes", "canned tomatoes", "tomato", "tomatoes"],
    per100g: n(32, 1.6, 0.3, 0, 7.3, 1.9, 4.4, 186),
    canGrams: 411,
    cupGrams: 242,
  },
  {
    id: "bell-pepper",
    fdcId: 170108,
    description: "Peppers, sweet, green, raw",
    aliases: ["bell pepper", "green pepper", "red pepper", "sweet pepper"],
    per100g: n(20, 0.9, 0.2, 0, 4.6, 1.7, 2.4, 3),
    pieceGrams: 119,
    cupGrams: 149,
  },
  {
    id: "cocoa",
    fdcId: 169593,
    description: "Cocoa, dry powder, unsweetened",
    aliases: ["cocoa", "cocoa powder", "unsweetened cocoa"],
    per100g: n(228, 19.6, 13.7, 8.1, 57.9, 37, 1.8, 21),
    cupGrams: 86,
    tbspGrams: 5.4,
  },
  {
    id: "vanilla",
    fdcId: 173478,
    description: "Vanilla extract",
    aliases: ["vanilla", "vanilla extract"],
    per100g: n(288, 0.1, 0.1, 0, 12.7, 0, 12.7, 9),
    tspGrams: 4.2,
  },
  {
    id: "espresso-powder",
    fdcId: 171891,
    description: "Coffee, instant, regular, powder",
    aliases: ["espresso powder", "instant espresso", "instant coffee"],
    per100g: n(241, 12.2, 0.5, 0.2, 41.1, 0, 0, 37),
    tspGrams: 1.8,
  },
  {
    id: "cheddar",
    fdcId: 173414,
    description: "Cheese, cheddar",
    aliases: ["cheddar", "cheddar cheese", "cheese"],
    per100g: n(403, 22.9, 33.1, 21.1, 1.3, 0, 0.5, 621),
    cupGrams: 113,
  },
  {
    id: "rice",
    fdcId: 169761,
    description: "Rice, white, long-grain, raw",
    aliases: ["rice", "white rice", "long grain rice"],
    per100g: n(365, 7.1, 0.7, 0.2, 80, 1.3, 0.1, 5),
    cupGrams: 185,
  },
  {
    id: "honey",
    fdcId: 169640,
    description: "Honey",
    aliases: ["honey"],
    per100g: n(304, 0.3, 0, 0, 82.4, 0.2, 82.1, 4),
    tbspGrams: 21,
    cupGrams: 339,
  },
  {
    id: "lemon-juice",
    fdcId: 167747,
    description: "Lemon juice, raw",
    aliases: ["lemon juice", "lemon", "juice of lemon"],
    per100g: n(22, 0.4, 0.2, 0, 6.9, 0.3, 2.5, 1),
    tbspGrams: 15,
    pieceGrams: 48,
  },
  {
    id: "broth",
    fdcId: 172883,
    description: "Soup, stock, beef, home-prepared",
    aliases: ["beef broth", "chicken broth", "stock", "broth", "chicken stock", "beef stock"],
    per100g: n(13, 1.4, 0.1, 0, 1.2, 0, 0.5, 198),
    cupGrams: 240,
  },
  {
    id: "carrot",
    fdcId: 170393,
    description: "Carrots, raw",
    aliases: ["carrot", "carrots"],
    per100g: n(41, 0.9, 0.2, 0, 9.6, 2.8, 4.7, 69),
    pieceGrams: 61,
    cupGrams: 128,
  },
  {
    id: "celery",
    fdcId: 169988,
    description: "Celery, raw",
    aliases: ["celery"],
    per100g: n(16, 0.7, 0.2, 0, 3, 1.6, 1.3, 80),
    pieceGrams: 40,
    cupGrams: 101,
  },
  {
    id: "tomato-paste",
    fdcId: 170117,
    description: "Tomato products, canned, paste",
    aliases: ["tomato paste"],
    per100g: n(82, 4.3, 0.5, 0.1, 18.9, 4.1, 12.2, 59),
    tbspGrams: 16,
    canGrams: 170,
  },
  {
    id: "sour-cream",
    fdcId: 170884,
    description: "Cream, sour, cultured",
    aliases: ["sour cream"],
    per100g: n(198, 2.4, 19.4, 12.1, 4.6, 0, 3.4, 80),
    cupGrams: 230,
  },
  {
    id: "yogurt",
    fdcId: 170903,
    description: "Yogurt, Greek, plain, nonfat",
    aliases: ["yogurt", "greek yogurt", "plain yogurt"],
    per100g: n(59, 10.2, 0.4, 0.1, 3.6, 0, 3.3, 36),
    cupGrams: 245,
  },
  {
    id: "oats",
    fdcId: 173904,
    description: "Cereals, oats, regular, dry",
    aliases: ["oats", "rolled oats", "old fashioned oats", "oatmeal"],
    per100g: n(379, 13.2, 6.5, 1.1, 67.7, 10.1, 0.8, 6),
    cupGrams: 81,
  },
];

const IGNORE = [
  "thermometer",
  "instant-read",
  "instant read",
  "parchment",
  "paper towel",
  "rack",
  "skillet",
  "sheet pan",
  "baking sheet",
  "bowl",
  "pot",
  "dutch oven",
  "foil",
  "twine",
  "plastic wrap",
];

export function shouldIgnoreIngredient(name: string): boolean {
  const value = name.toLowerCase();
  return IGNORE.some((token) => value.includes(token));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(
      /\b(fresh|chopped|diced|minced|sliced|softened|melted|drained|rinsed|packed|sifted|divided|optional|organic|cold|warm|hot|room temperature|about|plus more|to taste|unsalted|salted|large|small|medium|finely|roughly|thinly|grated|shredded|crushed|ground|dried|canned|cooked|raw)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

type AliasEntry = { alias: string; food: CatalogFood };

const ALIASES: AliasEntry[] = CATALOG.flatMap((food) =>
  [food.description, ...food.aliases].map((alias) => ({ alias: normalize(alias), food })),
).sort((a, b) => b.alias.length - a.alias.length);

export function findCatalogFood(name: string): CatalogFood | null {
  const needle = normalize(name);
  if (!needle) return null;
  const exact = ALIASES.find((entry) => entry.alias === needle);
  if (exact) return exact.food;
  const contained = ALIASES.find(
    (entry) => entry.alias.length >= 4 && (needle.includes(entry.alias) || entry.alias.includes(needle)),
  );
  return contained?.food ?? null;
}

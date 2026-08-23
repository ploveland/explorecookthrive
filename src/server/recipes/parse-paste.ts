import { parseIngredientLine } from "./parse-ingredient";
import { parseDurationToMinutes } from "./parse-duration";
import type { ExtractedRecipe } from "./schema";

const INGREDIENT_HEADER = /^(ingredients?|what you need|shopping list)\s*:?$/i;
const METHOD_HEADER = /^(instructions?|directions?|method|steps|preparation)\s*:?$/i;

export function parsePastedRecipe(text: string): ExtractedRecipe {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1]?.length > 0));

  const compact = lines.filter(Boolean);
  if (compact.length < 3) {
    return fallback(text);
  }

  const title = compact[0]!.replace(/^#+\s*/, "");
  let ingredientStart = compact.findIndex((line) => INGREDIENT_HEADER.test(line));
  let methodStart = compact.findIndex((line) => METHOD_HEADER.test(line));

  if (ingredientStart === -1 || methodStart === -1) {
    const split = inferSplit(compact.slice(1));
    ingredientStart = 0;
    methodStart = split;
    const body = compact.slice(1);
    const ingredientLines = body.slice(0, split);
    const instructionLines = body.slice(split);
    return build(title, text, ingredientLines, instructionLines, ["We guessed where ingredients end and steps begin."]);
  }

  const preamble = compact.slice(1, ingredientStart);
  const ingredientLines = compact.slice(ingredientStart + 1, methodStart === -1 ? undefined : methodStart);
  const instructionLines = methodStart === -1 ? [] : compact.slice(methodStart + 1);
  const meta = parseMeta(preamble);

  return {
    ...build(title, text, ingredientLines, instructionLines, []),
    ...meta,
  };
}

function inferSplit(lines: string[]): number {
  const scores = lines.map((line, index) => ({
    index,
    looksLikeStep: /^(?:\d+[\.)]|step\s+\d+)/i.test(line) || line.length > 80,
  }));
  const firstStep = scores.find((item) => item.looksLikeStep);
  return firstStep ? firstStep.index : Math.max(1, Math.ceil(lines.length / 2));
}

function parseMeta(lines: string[]) {
  const blob = lines.join(" \n ");
  const servings = blob.match(/serv(?:es|ings?)[:\s]+(\d+)/i);
  const prep = blob.match(/prep(?: time)?[:\s]+([^,\n]+)/i);
  const cook = blob.match(/cook(?: time)?[:\s]+([^,\n]+)/i);
  return {
    description: lines.find((line) => line.length > 40) ?? null,
    servings: servings ? Number(servings[1]) : null,
    prepMinutes: parseDurationToMinutes(prep?.[1] ?? null),
    cookMinutes: parseDurationToMinutes(cook?.[1] ?? null),
  };
}

function build(
  title: string,
  original: string,
  ingredientLines: string[],
  instructionLines: string[],
  assumptions: string[],
): ExtractedRecipe {
  const ingredients = ingredientLines
    .filter((line) => line && !INGREDIENT_HEADER.test(line))
    .map((line) => parseIngredientLine(line.replace(/^\d+[.)]\s+/, "")));
  const instructions = instructionLines
    .filter((line) => line && !METHOD_HEADER.test(line))
    .map((line) => line.replace(/^\d+[.)]\s+/, "").trim())
    .filter(Boolean);

  if (ingredients.length === 0 || instructions.length === 0) {
    return fallback(original);
  }

  return {
    title,
    description: null,
    servings: null,
    prepMinutes: null,
    cookMinutes: null,
    cuisine: null,
    category: null,
    ingredients,
    instructions,
    sourceUrl: null,
    sourceSite: null,
    sourceAuthor: null,
    originalTitle: title,
    extractor: "paste",
    confidence: assumptions.length ? "medium" : "high",
    warnings: [],
    assumptions,
  };
}

function fallback(text: string): ExtractedRecipe {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    title: lines[0] || "Pasted recipe",
    description: null,
    servings: null,
    prepMinutes: null,
    cookMinutes: null,
    cuisine: null,
    category: null,
    ingredients: lines.slice(1, 6).map(parseIngredientLine),
    instructions: lines.slice(6).length ? lines.slice(6) : ["See pasted recipe."],
    sourceUrl: null,
    sourceSite: null,
    sourceAuthor: null,
    originalTitle: lines[0] || "Pasted recipe",
    extractor: "paste",
    confidence: "low",
    warnings: ["We could not find clear ingredient and instruction sections. Please tidy this up before converting."],
    assumptions: ["The paste was treated as unstructured notes."],
  };
}

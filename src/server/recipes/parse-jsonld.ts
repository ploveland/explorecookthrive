import { parseDurationToMinutes } from "./parse-duration";
import { parseIngredientLine } from "./parse-ingredient";
import type { ExtractedRecipe } from "./schema";

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textOf(record.name ?? record.text ?? record["@value"]);
  }
  return null;
}

function isRecipeNode(node: unknown): node is Record<string, unknown> {
  if (!node || typeof node !== "object") return false;
  const type = (node as { ["@type"]?: unknown })["@type"];
  const types = asArray(type).map((item) => String(item).toLowerCase());
  return types.some((item) => item === "recipe" || item.endsWith("/recipe"));
}

function collectNodes(value: unknown, acc: unknown[] = []): unknown[] {
  if (!value) return acc;
  if (Array.isArray(value)) {
    for (const item of value) collectNodes(item, acc);
    return acc;
  }
  if (typeof value === "object") {
    acc.push(value);
    const record = value as Record<string, unknown>;
    if (record["@graph"]) collectNodes(record["@graph"], acc);
    if (record.mainEntity) collectNodes(record.mainEntity, acc);
  }
  return acc;
}

function instructionTexts(value: unknown): string[] {
  const steps: string[] = [];
  for (const item of asArray(value)) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) steps.push(text);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const types = asArray(record["@type"]).map((entry) => String(entry).toLowerCase());
    if (types.some((type) => type.includes("howtosection"))) {
      steps.push(...instructionTexts(record.itemListElement));
      continue;
    }
    const text = textOf(record.text ?? record.name);
    if (text) steps.push(text);
  }
  return steps;
}

export function extractJsonLdScripts(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      try {
        blocks.push(JSON.parse(raw.replace(/,\s*([}\]])/g, "$1")));
      } catch {
        // Ignore malformed JSON-LD blocks.
      }
    }
  }
  return blocks;
}

export function recipeFromJsonLd(
  html: string,
  sourceUrl: string,
): ExtractedRecipe | null {
  const nodes = extractJsonLdScripts(html).flatMap((block) => collectNodes(block));
  const recipeNode = nodes.find(isRecipeNode);
  if (!recipeNode) return null;

  const ingredients = asArray(recipeNode.recipeIngredient)
    .map((item) => textOf(item))
    .filter((item): item is string => Boolean(item))
    .map(parseIngredientLine);

  const instructions = instructionTexts(recipeNode.recipeInstructions);
  if (ingredients.length === 0 || instructions.length === 0) return null;

  const title = textOf(recipeNode.name) ?? "Untitled recipe";
  const hostname = (() => {
    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  return {
    title,
    description: textOf(recipeNode.description),
    servings: parseYield(recipeNode.recipeYield),
    prepMinutes: parseDurationToMinutes(recipeNode.prepTime),
    cookMinutes: parseDurationToMinutes(recipeNode.cookTime ?? recipeNode.totalTime),
    cuisine: textOf(recipeNode.recipeCuisine),
    category: textOf(recipeNode.recipeCategory),
    ingredients,
    instructions,
    sourceUrl,
    sourceSite: hostname,
    sourceAuthor: textOf(recipeNode.author),
    originalTitle: title,
    extractor: "jsonld",
    confidence: "high",
    warnings: [],
    assumptions: [],
  };
}

function parseYield(value: unknown): number | null {
  const first = asArray(value)[0];
  const text = textOf(first);
  if (!text) return null;
  const match = text.replace(",", "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function recipeFromMicrodata(html: string, sourceUrl: string): ExtractedRecipe | null {
  if (!/itemtype=["'][^"']*schema\.org\/Recipe["']/i.test(html)) return null;

  const title =
    matchProp(html, "name") ??
    html.match(/<h1[^>]*>([^<]{3,120})<\/h1>/i)?.[1]?.trim() ??
    null;
  const ingredients = [...html.matchAll(/itemprop=["']recipeIngredient["'][^>]*>([^<]+)/gi)]
    .map((match) => match[1]?.replace(/<[^>]+>/g, "").trim())
    .filter((item): item is string => Boolean(item))
    .map(parseIngredientLine);
  const instructions = [...html.matchAll(/itemprop=["']recipeInstructions["'][^>]*>([\s\S]*?)<\/(?:li|p|div|span)>/gi)]
    .map((match) => match[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((item): item is string => Boolean(item));

  if (!title || ingredients.length === 0 || instructions.length === 0) return null;

  return {
    title,
    description: matchProp(html, "description"),
    servings: parseYield(matchProp(html, "recipeYield")),
    prepMinutes: parseDurationToMinutes(matchProp(html, "prepTime")),
    cookMinutes: parseDurationToMinutes(matchProp(html, "cookTime")),
    cuisine: matchProp(html, "recipeCuisine"),
    category: matchProp(html, "recipeCategory"),
    ingredients,
    instructions,
    sourceUrl,
    sourceSite: new URL(sourceUrl).hostname.replace(/^www\./, ""),
    sourceAuthor: matchProp(html, "author"),
    originalTitle: title,
    extractor: "html",
    confidence: "medium",
    warnings: ["We read this page from HTML markup, not structured recipe data. Please check amounts."],
    assumptions: [],
  };
}

function matchProp(html: string, prop: string): string | null {
  const content = html.match(
    new RegExp(`itemprop=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i"),
  );
  if (content?.[1]) return content[1].trim();
  const inner = html.match(new RegExp(`itemprop=["']${prop}["'][^>]*>([^<]+)`, "i"));
  return inner?.[1]?.trim() || null;
}


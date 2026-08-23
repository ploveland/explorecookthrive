import type { ExtractedIngredient } from "./schema";

const UNIT_PATTERN =
  "(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|pounds?|lbs?|ounces?|oz|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|pints?|quarts?|gallons?|cloves?|slices?|pinch(?:es)?|dash(?:es)?|cans?|packages?|pkg|sticks?|bunches?|heads?|pieces?|whole)";

const LINE = new RegExp(
  `^\\s*(?:[-*•]\\s*)?(?:(\\d+(?:\\s+\\d+\\/\\d+|\\.\\d+|\\/\\d+)?)\\s+)?(?:(${UNIT_PATTERN})\\s+)?(.+?)$`,
  "i",
);

function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const parts = raw.trim().split(/\s+/);
  let total = 0;
  for (const part of parts) {
    if (part.includes("/")) {
      const [n, d] = part.split("/").map(Number);
      if (!d) return null;
      total += n / d;
    } else {
      const value = Number(part);
      if (!Number.isFinite(value)) return null;
      total += value;
    }
  }
  return total;
}

export function parseIngredientLine(rawText: string): ExtractedIngredient {
  const text = rawText.replace(/\s+/g, " ").trim();
  const match = text.match(LINE);
  if (!match) {
    return { rawText: text, name: text, quantity: null, unit: null, preparation: null };
  }

  const quantity = toNumber(match[1]);
  const unit = match[2] ? match[2].toLowerCase() : null;
  let rest = (match[3] ?? text).trim();
  let preparation: string | null = null;
  const comma = rest.split(",");
  if (comma.length > 1) {
    preparation = comma.slice(1).join(",").trim() || null;
    rest = comma[0].trim();
  }

  return {
    rawText: text,
    name: rest || text,
    quantity,
    unit,
    preparation,
  };
}

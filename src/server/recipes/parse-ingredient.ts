import type { ExtractedIngredient } from "./schema";

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const UNIT_PATTERN =
  "cups?|tablespoons?|tbsp|tbs|teaspoons?|tsp|pounds?|lbs?|ounces?|oz|grams?|kilograms?|kg|milliliters?|ml|liters?|litres?|l|pints?|quarts?|gallons?|cloves?|slices?|pinch(?:es)?|dash(?:es)?|cans?|packages?|pkgs?|sticks?|bunches?|heads?|pieces?";

const UNIT_RE = new RegExp(`^(${UNIT_PATTERN})\\.?(?=\\s|$|\\()`, "i");
const CAN_RE = /^cans?(?=\s|$)/i;
const PAREN_WEIGHT_RE =
  /\(\s*(\d+(?:\.\d+)?)\s*-?\s*(oz|ounces?|lbs?|pounds?|grams?|kg|g)\s*\)/i;
const ADJECTIVE_WEIGHT_RE = /(\d+(?:\.\d+)?)\s*-\s*(ounce|oz|pound|lb)s?\b/i;

function normalizeFractions(text: string) {
  const mixed = text.replace(/(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])/g, (_, whole, glyph) => {
    const part = UNICODE_FRACTIONS[glyph];
    return part == null ? `${whole}` : String(Number(whole) + part);
  });
  return mixed.replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, (glyph) => {
    const part = UNICODE_FRACTIONS[glyph];
    return part == null ? glyph : String(part);
  });
}

function parseNumber(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  if (text.includes("/")) {
    const [n, d] = text.split("/").map(Number);
    if (!d || !Number.isFinite(n) || !Number.isFinite(d)) return null;
    return n / d;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function parseLeadingQuantity(text: string): { quantity: number | null; rest: string } {
  const range = text.match(/^(\d+(?:\.\d+)?)(?:\s*[-–—]\s*|\s+to\s+)(\d+(?:\.\d+)?)\b/i);
  if (range) {
    const low = Number(range[1]);
    const high = Number(range[2]);
    return { quantity: (low + high) / 2, rest: text.slice(range[0].length).trim() };
  }

  const mixed = text.match(/^(\d+)\s+(\d+\s*\/\s*\d+)\b/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const frac = parseNumber(mixed[2]);
    if (frac != null) {
      return { quantity: whole + frac, rest: text.slice(mixed[0].length).trim() };
    }
  }

  const frac = text.match(/^(\d+\s*\/\s*\d+)\b/);
  if (frac) {
    const value = parseNumber(frac[1]!);
    if (value != null) return { quantity: value, rest: text.slice(frac[0].length).trim() };
  }

  const decimal = text.match(/^(\d+(?:\.\d+)?)\b/);
  if (decimal) {
    return { quantity: Number(decimal[1]), rest: text.slice(decimal[0].length).trim() };
  }

  return { quantity: null, rest: text };
}

export function weightFromRawText(
  rawText: string,
): { quantity: number; unit: string } | null {
  const text = normalizeFractions(rawText.replace(/\s+/g, " ").trim());
  const paren = text.match(PAREN_WEIGHT_RE);
  if (paren) return { quantity: Number(paren[1]), unit: paren[2]!.toLowerCase() };
  const adjective = text.match(ADJECTIVE_WEIGHT_RE);
  if (adjective) return { quantity: Number(adjective[1]), unit: adjective[2]!.toLowerCase() };
  const leading = text.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})\\.?\\b`, "i"),
  );
  if (!leading) return null;
  const unit = leading[2]!.toLowerCase().replace(/\.$/, "");
  if (!/^(?:oz|ounces?|lbs?|pounds?|g|grams?|kg|kilograms?)$/.test(unit)) return null;
  return { quantity: Number(leading[1]), unit };
}

export function parseIngredientLine(rawText: string): ExtractedIngredient {
  const original = rawText.replace(/\s+/g, " ").trim();
  let text = normalizeFractions(original.replace(/^(?:[-*•]\s*)/, ""));

  const paren = text.match(PAREN_WEIGHT_RE);
  const adjective = !paren ? text.match(ADJECTIVE_WEIGHT_RE) : null;
  if (paren) text = text.replace(PAREN_WEIGHT_RE, " ").replace(/\s+/g, " ").trim();
  if (adjective) text = text.replace(ADJECTIVE_WEIGHT_RE, " ").replace(/\s+/g, " ").trim();

  const leading = parseLeadingQuantity(text);
  let rest = leading.rest;
  let quantity = leading.quantity;
  let unit: string | null = null;

  const unitMatch = rest.match(UNIT_RE);
  if (unitMatch) {
    unit = unitMatch[1]!.toLowerCase().replace(/\.$/, "");
    rest = rest.slice(unitMatch[0].length).trim();
  } else if (CAN_RE.test(rest)) {
    unit = "can";
    rest = rest.replace(CAN_RE, "").trim();
  }

  rest = rest.replace(/^(?:of\s+)/i, "").trim();
  let preparation: string | null = null;
  const comma = rest.split(",");
  if (comma.length > 1) {
    preparation = comma.slice(1).join(",").trim() || null;
    rest = comma[0]!.trim();
  }

  const packed = paren
    ? { quantity: Number(paren[1]), unit: paren[2]!.toLowerCase() }
    : adjective
      ? { quantity: Number(adjective[1]), unit: adjective[2]!.toLowerCase() }
      : null;
  const canLine = /\bcan(?:ned|s)?\b/i.test(original);
  if (packed && !canLine) {
    quantity = packed.quantity;
    unit = packed.unit;
  } else if (!unit && packed) {
    quantity = packed.quantity;
    unit = packed.unit;
  } else if (!unit && canLine && quantity != null) {
    unit = "can";
  }

  return {
    rawText: original,
    name: rest || original,
    quantity,
    unit,
    preparation,
  };
}

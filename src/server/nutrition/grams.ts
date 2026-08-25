import type { CatalogFood } from "./catalog";
import { weightFromRawText } from "../recipes/parse-ingredient";


const G_PER_OZ = 28.3495;
const G_PER_LB = 453.592;

const UNIT_ALIASES: Record<string, string> = {
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  l: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  cup: "cup",
  cups: "cup",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  pinch: "pinch",
  pinches: "pinch",
  dash: "dash",
  dashes: "dash",
  stick: "stick",
  sticks: "stick",
  clove: "clove",
  cloves: "clove",
  can: "can",
  cans: "can",
  slice: "slice",
  slices: "slice",
  bunch: "bunch",
  bunches: "bunch",
  head: "head",
  heads: "head",
  piece: "piece",
  pieces: "piece",
  package: "package",
  packages: "package",
  pkg: "package",
  pkgs: "package",
  pint: "pint",
  pints: "pint",
  quart: "quart",
  quarts: "quart",
  gallon: "gallon",
  gallons: "gallon",
  tbs: "tbsp",
};

const CONVERTIBLE_UNITS = new Set([
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "l",
  "pint",
  "quart",
  "gallon",
  "cup",
  "tbsp",
  "tsp",
  "pinch",
  "dash",
  "stick",
  "clove",
  "can",
  "slice",
  "bunch",
  "head",
  "piece",
  "package",
]);

export function canonicalUnit(unit: string | null | undefined): string | null {
  if (!unit) return null;
  const key = unit.trim().toLowerCase().replace(/\.$/, "");
  return UNIT_ALIASES[key] ?? key;
}

export function isConvertibleUnit(unit: string | null | undefined): boolean {
  const canonical = canonicalUnit(unit);
  return Boolean(canonical && CONVERTIBLE_UNITS.has(canonical));
}

export function toGrams(
  quantity: number | null,
  unit: string | null | undefined,
  food: CatalogFood | null,
  rawText?: string,
): { grams: number | null; assumed: boolean; note: string | null } {
  const direct = convertToGrams(quantity, unit, food);
  if (direct.grams != null) return direct;

  const fromRaw = rawText ? weightFromRawText(rawText) : null;
  if (fromRaw) {
    const converted = convertToGrams(fromRaw.quantity, fromRaw.unit, food);
    if (converted.grams != null) {
      return {
        ...converted,
        assumed: true,
        note: converted.note ?? `Used ${fromRaw.quantity} ${fromRaw.unit} from the ingredient line.`,
      };
    }
  }

  if (food && rawText && /\bcan(?:ned|s)?\b/i.test(rawText) && food.canGrams) {
    const count = quantity && quantity > 0 ? quantity : 1;
    return {
      grams: food.canGrams * count,
      assumed: true,
      note: `A can is counted as ${food.canGrams}g of ${food.description.toLowerCase()}.`,
    };
  }

  return direct;
}

function convertToGrams(
  quantity: number | null,
  unit: string | null | undefined,
  food: CatalogFood | null,
): { grams: number | null; assumed: boolean; note: string | null } {
  if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) {
    if (food?.pieceGrams && !unit) {
      return {
        grams: food.pieceGrams,
        assumed: true,
        note: `Counted as one ${food.description.toLowerCase()} (${food.pieceGrams}g).`,
      };
    }
    return { grams: null, assumed: false, note: "No amount to convert." };
  }

  const canonical = canonicalUnit(unit);
  if (!canonical) {
    if (food?.pieceGrams) {
      return {
        grams: food.pieceGrams * quantity,
        assumed: true,
        note: `Used a typical piece weight of ${food.pieceGrams}g for ${food.description.toLowerCase()}.`,
      };
    }
    return { grams: null, assumed: false, note: "No unit, and no typical piece weight." };
  }

  if (canonical === "g") return { grams: quantity, assumed: false, note: null };
  if (canonical === "kg") return { grams: quantity * 1000, assumed: false, note: null };
  if (canonical === "oz") return { grams: quantity * G_PER_OZ, assumed: false, note: null };
  if (canonical === "lb") return { grams: quantity * G_PER_LB, assumed: false, note: null };

  const density = food?.densityGPerMl ?? 1;
  if (canonical === "ml") return { grams: quantity * density, assumed: !food?.densityGPerMl, note: null };
  if (canonical === "l") return { grams: quantity * 1000 * density, assumed: !food?.densityGPerMl, note: null };
  if (canonical === "pint") return { grams: quantity * 473.176 * density, assumed: true, note: null };
  if (canonical === "quart") return { grams: quantity * 946.353 * density, assumed: true, note: null };
  if (canonical === "gallon") return { grams: quantity * 3785.41 * density, assumed: true, note: null };

  if (canonical === "cup") {
    const cup = food?.cupGrams ?? 240 * density;
    return {
      grams: quantity * cup,
      assumed: !food?.cupGrams,
      note: food?.cupGrams
        ? null
        : `Used ${Math.round(cup)}g per cup for ${food?.description ?? "this ingredient"}.`,
    };
  }
  if (canonical === "tbsp") {
    const tbsp = food?.tbspGrams ?? (food?.cupGrams ? food.cupGrams / 16 : 15 * density);
    return { grams: quantity * tbsp, assumed: !food?.tbspGrams && !food?.cupGrams, note: null };
  }
  if (canonical === "tsp") {
    const tsp = food?.tspGrams ?? (food?.cupGrams ? food.cupGrams / 48 : 5 * density);
    return { grams: quantity * tsp, assumed: !food?.tspGrams && !food?.cupGrams, note: null };
  }
  if (canonical === "pinch") return { grams: quantity * 0.3, assumed: true, note: "A pinch is counted as 0.3g." };
  if (canonical === "dash") return { grams: quantity * 0.6, assumed: true, note: "A dash is counted as 0.6g." };

  if (canonical === "stick") {
    const stick = food?.stickGrams ?? 113;
    return {
      grams: quantity * stick,
      assumed: !food?.stickGrams,
      note: `A stick is counted as ${stick}g.`,
    };
  }
  if (canonical === "clove") {
    const clove = food?.cloveGrams ?? food?.pieceGrams ?? 3;
    return {
      grams: quantity * clove,
      assumed: true,
      note: `A clove is counted as ${clove}g.`,
    };
  }
  if (canonical === "can") {
    const can = food?.canGrams ?? 411;
    return {
      grams: quantity * can,
      assumed: true,
      note: `A can is counted as ${can}g${food ? ` of ${food.description.toLowerCase()}` : ""}.`,
    };
  }
  if (canonical === "slice") {
    const slice = food?.sliceGrams ?? food?.pieceGrams ?? 28;
    return { grams: quantity * slice, assumed: true, note: `A slice is counted as ${slice}g.` };
  }
  if (canonical === "bunch") {
    const bunch = food?.bunchGrams ?? 60;
    return { grams: quantity * bunch, assumed: true, note: `A bunch is counted as ${bunch}g.` };
  }
  if (canonical === "head") {
    const head = food?.pieceGrams ?? 500;
    return { grams: quantity * head, assumed: true, note: `A head is counted as ${head}g.` };
  }
  if (canonical === "piece" || canonical === "package") {
    if (food?.pieceGrams) {
      return {
        grams: quantity * food.pieceGrams,
        assumed: true,
        note: `Used a typical piece weight of ${food.pieceGrams}g.`,
      };
    }
    if (canonical === "package" && food?.canGrams) {
      return { grams: quantity * food.canGrams, assumed: true, note: `A package is counted as ${food.canGrams}g.` };
    }
  }

  if (food?.pieceGrams && !CONVERTIBLE_UNITS.has(canonical)) {
    return {
      grams: food.pieceGrams * quantity,
      assumed: true,
      note: `Used a typical piece weight of ${food.pieceGrams}g for ${food.description.toLowerCase()}.`,
    };
  }

  return { grams: null, assumed: false, note: `Could not convert unit “${unit}”.` };
}

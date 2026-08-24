export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 24;

export type ScalableIngredient = {
  rawText: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
  assumptionNote?: string | null;
};

const FRACTIONS: { value: number; glyph: string }[] = [
  { value: 0, glyph: "" },
  { value: 1 / 8, glyph: "⅛" },
  { value: 1 / 4, glyph: "¼" },
  { value: 1 / 3, glyph: "⅓" },
  { value: 3 / 8, glyph: "⅜" },
  { value: 1 / 2, glyph: "½" },
  { value: 5 / 8, glyph: "⅝" },
  { value: 2 / 3, glyph: "⅔" },
  { value: 3 / 4, glyph: "¾" },
  { value: 7 / 8, glyph: "⅞" },
  { value: 1, glyph: "" },
];

export function clampServings(value: number) {
  if (!Number.isFinite(value)) return MIN_SERVINGS;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)));
}

export function servingFactor(baseServings: number, desiredServings: number) {
  const base = baseServings > 0 ? baseServings : 1;
  return clampServings(desiredServings) / base;
}

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  let closest = FRACTIONS[0]!;
  let best = Infinity;
  for (const item of FRACTIONS) {
    const delta = Math.abs(frac - item.value);
    if (delta < best) {
      best = delta;
      closest = item;
    }
  }
  if (closest.value === 1) return `${whole + 1}`;
  if (!closest.glyph) {
    if (best > 0.04) {
      const rounded = Math.round(value * 10) / 10;
      return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
    }
    return whole === 0 ? "0" : `${whole}`;
  }
  return whole === 0 ? closest.glyph : `${whole}${closest.glyph}`;
}

export function scaleIngredientText(item: ScalableIngredient, factor: number): {
  text: string;
  scaled: boolean;
} {
  if (item.quantity == null || factor === 1) {
    return { text: item.rawText, scaled: false };
  }
  const amount = formatQuantity(item.quantity * factor);
  const unit = item.unit?.trim() ? ` ${item.unit.trim()}` : "";
  const name = item.name.trim();
  const prep = item.preparation?.trim() ? `, ${item.preparation.trim()}` : "";
  const text = `${amount}${unit} ${name}${prep}`.replace(/\s+/g, " ").trim();
  return { text, scaled: true };
}

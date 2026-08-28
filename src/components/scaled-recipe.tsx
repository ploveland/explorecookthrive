"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_SERVINGS,
  MIN_SERVINGS,
  clampServings,
  scaleIngredientText,
  servingFactor,
  type ScalableIngredient,
} from "@/server/recipes/scale";

export function ScaledRecipe({
  title,
  description,
  servings,
  prepMinutes,
  cookMinutes,
  ingredients,
  instructions,
}: {
  title?: string;
  description?: string | null;
  servings: number;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  ingredients: ScalableIngredient[];
  instructions: string[];
}) {
  const base = servings > 0 ? servings : 1;
  const [desired, setDesired] = useState(base);
  const factor = servingFactor(base, desired);
  const scaled = useMemo(
    () => ingredients.map((item) => ({ item, ...scaleIngredientText(item, factor) })),
    [ingredients, factor],
  );
  const unmeasured = scaled.some((entry) => !entry.scaled && entry.item.quantity == null);

  function bump(delta: number) {
    setDesired((current) => clampServings(current + delta));
  }

  return (
    <div>
      {title ? <h3 className="font-heading text-2xl text-teal">{title}</h3> : null}
      {description ? <p className="mt-1 text-sm text-teal/75">{description}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-teal/70">
          {prepMinutes ? `${prepMinutes} min prep` : null}
          {prepMinutes && cookMinutes ? " · " : null}
          {cookMinutes ? `${cookMinutes} min cook` : null}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-medium text-teal">Servings</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Fewer servings"
            disabled={desired <= MIN_SERVINGS}
            onClick={() => bump(-1)}
          >
            −
          </Button>
          <p aria-live="polite" className="min-w-8 text-center text-sm font-semibold tabular-nums text-teal">
            {desired}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="More servings"
            disabled={desired >= MAX_SERVINGS}
            onClick={() => bump(1)}
          >
            +
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-teal/65">
        Per-serving USDA estimates stay the same. Ingredient amounts scale with the pot.
        {unmeasured && factor !== 1
          ? " Lines without a measured amount stay as written."
          : null}
      </p>

      <h2 className="mt-6 font-heading text-xl text-teal">Ingredients</h2>
      <ul className="mt-4 space-y-2 text-sm text-teal">
        {scaled.map((entry) => (
          <li key={entry.item.rawText}>
            {entry.text}
            {entry.item.assumptionNote ? (
              <span className="mt-0.5 block text-xs text-teal/65">{entry.item.assumptionNote}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 font-heading text-xl text-teal">Instructions</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-teal/80">
        {instructions.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

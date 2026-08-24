import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hasNutritionFilters,
  libraryHref,
  type NutritionFilters,
} from "@/server/library/nutrition-filter";

const PRESETS = [
  { label: "Under 500 cal", nutrition: { maxCalories: 500, minProtein: null, minFiber: null, maxSodium: null } },
  { label: "30g+ protein", nutrition: { maxCalories: null, minProtein: 30, minFiber: null, maxSodium: null } },
  { label: "8g+ fiber", nutrition: { maxCalories: null, minProtein: null, minFiber: 8, maxSodium: null } },
  { label: "Under 600mg sodium", nutrition: { maxCalories: null, minProtein: null, minFiber: null, maxSodium: 600 } },
] as const;

export function NutritionFiltersForm({
  action,
  query,
  tag,
  tested,
  filters,
}: {
  action: "/recipes" | "/search";
  query?: string;
  tag?: string | null;
  tested?: boolean;
  filters: NutritionFilters;
}) {
  const base = { path: action, tag, tested, q: query, nutrition: filters };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-wide text-teal/60 uppercase">Per serving · USDA</p>
      <p className="text-xs text-teal/65">
        Bounds use Thrive Version estimates, not the language model. Recipes without a match stay out.
      </p>
      <ul className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const href = libraryHref({ ...base, nutrition: preset.nutrition });
          const active =
            filters.maxCalories === preset.nutrition.maxCalories &&
            filters.minProtein === preset.nutrition.minProtein &&
            filters.minFiber === preset.nutrition.minFiber &&
            filters.maxSodium === preset.nutrition.maxSodium;
          return (
            <li key={preset.label}>
              <Link
                href={href}
                className={`inline-flex rounded-full px-3 py-1 text-xs ${
                  active ? "bg-teal text-cream" : "bg-sage/20 text-teal hover:bg-sage/30"
                }`}
              >
                {preset.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={action} method="get" className="grid gap-2">
        {query ? <input type="hidden" name="q" value={query} /> : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        {tested ? <input type="hidden" name="tested" value="1" /> : null}
        <label className="text-xs text-teal">
          Max calories
          <Input
            name="maxCal"
            type="number"
            min={1}
            step={1}
            defaultValue={filters.maxCalories ?? ""}
            className="mt-1 h-9 bg-white/80"
          />
        </label>
        <label className="text-xs text-teal">
          Min protein (g)
          <Input
            name="minProtein"
            type="number"
            min={1}
            step={1}
            defaultValue={filters.minProtein ?? ""}
            className="mt-1 h-9 bg-white/80"
          />
        </label>
        <label className="text-xs text-teal">
          Min fiber (g)
          <Input
            name="minFiber"
            type="number"
            min={1}
            step={0.5}
            defaultValue={filters.minFiber ?? ""}
            className="mt-1 h-9 bg-white/80"
          />
        </label>
        <label className="text-xs text-teal">
          Max sodium (mg)
          <Input
            name="maxSodium"
            type="number"
            min={1}
            step={1}
            defaultValue={filters.maxSodium ?? ""}
            className="mt-1 h-9 bg-white/80"
          />
        </label>
        <Button type="submit" variant="outline" className="h-9">
          Apply
        </Button>
      </form>
      {hasNutritionFilters(filters) ? (
        <Link
          href={libraryHref({ ...base, nutrition: undefined })}
          className="text-xs font-medium text-terracotta underline-offset-4 hover:underline"
        >
          Clear nutrition bounds
        </Link>
      ) : null}
    </div>
  );
}

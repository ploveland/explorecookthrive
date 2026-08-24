import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { NutritionFiltersForm } from "@/components/nutrition-filters";
import { getRatingSummaries } from "@/server/community/store";
import {
  hasNutritionFilters,
  libraryHref,
  parseNutritionFilters,
} from "@/server/library/nutrition-filter";
import { listPublished } from "@/server/library/store";
import { TAXONOMY_TAGS } from "@/server/taxonomy/tags";

export const dynamic = "force-dynamic";

const FILTERS = [
  { type: "MEAL", label: "Meal" },
  { type: "CUISINE", label: "Cuisine" },
  { type: "NUTRITION_GOAL", label: "Nutrition" },
  { type: "DIETARY", label: "Dietary" },
  { type: "COOKING_STYLE", label: "Style" },
  { type: "COLLECTION_THEME", label: "Collection" },
] as const;

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tag?: string;
    tested?: string;
    maxCal?: string;
    minProtein?: string;
    minFiber?: string;
    maxSodium?: string;
  }>;
}) {
  const params = await searchParams;
  const selected = params.tag?.trim().toLowerCase() || null;
  const onlyTested = params.tested === "1";
  const nutrition = parseNutritionFilters(params);
  const recipes = await listPublished({ tag: selected, nutrition });
  const summaries = await getRatingSummaries(recipes.map((recipe) => recipe.slug));
  const shown = onlyTested
    ? recipes.filter((recipe) => summaries[recipe.slug]?.communityTested)
    : recipes;
  const selectedName = TAXONOMY_TAGS.find((item) => item.slug === selected)?.name;
  const filtered = Boolean(selected || onlyTested || hasNutritionFilters(nutrition));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Library</p>
        <h1 className="font-heading mt-2 text-4xl text-teal">Recipes</h1>
        <p className="mt-3 text-lg leading-8 text-teal/80">
          Public Thrive Versions live here: short, attributed, and honest about what changed.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6 rounded-2xl bg-white/70 p-4 ring-1 ring-teal/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-teal">Browse</p>
            {filtered ? (
              <Link href="/recipes" className="text-xs font-medium text-terracotta underline-offset-4 hover:underline">
                Clear
              </Link>
            ) : null}
          </div>
          <NutritionFiltersForm
            action="/recipes"
            tag={selected}
            tested={onlyTested}
            filters={nutrition}
          />
          <div>
            <p className="text-xs font-semibold tracking-wide text-teal/60 uppercase">Community</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              <li>
                <Link
                  href={libraryHref({ tested: true, nutrition })}
                  className={`inline-flex rounded-full px-3 py-1 text-xs ${
                    onlyTested ? "bg-teal text-cream" : "bg-sage/20 text-teal hover:bg-sage/30"
                  }`}
                >
                  Community Tested
                </Link>
              </li>
            </ul>
          </div>
          {FILTERS.map((group) => (
            <div key={group.type}>
              <p className="text-xs font-semibold tracking-wide text-teal/60 uppercase">{group.label}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {TAXONOMY_TAGS.filter((item) => item.type === group.type).map((item) => {
                    const active = selected === item.slug;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={libraryHref({ tag: item.slug, nutrition })}
                          className={`inline-flex rounded-full px-3 py-1 text-xs ${
                            active ? "bg-teal text-cream" : "bg-sage/20 text-teal hover:bg-sage/30"
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </aside>

        {shown.length === 0 ? (
          <div className="flex min-h-80 flex-col items-start justify-center rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
            <h2 className="font-heading text-2xl text-teal">
              {onlyTested
                ? "No Community Tested Thrive Versions yet"
                : selectedName
                  ? `No ${selectedName.toLowerCase()} Thrive Versions yet`
                  : hasNutritionFilters(nutrition)
                    ? "No Thrive Versions in those USDA bounds"
                    : "No Thrive Versions yet"}
            </h2>
            <p className="mt-3 max-w-lg text-teal/80">
              {onlyTested
                ? "Cook a published Thrive Version, then rate taste and texture. Three kitchens at 4 or higher who would make it again earn this badge."
                : hasNutritionFilters(nutrition)
                  ? "Try a wider calorie, protein, fiber, or sodium range. Numbers come from USDA estimates on the Thrive Version."
                  : "Convert a recipe you already love, then publish the short Thrive Version to this shelf."}
            </p>
            <Button render={<Link href="/#thrive" />} className="mt-6 h-11 bg-terracotta-strong px-5 text-cream">
              Thrive a recipe
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} community={summaries[recipe.slug]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

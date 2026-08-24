import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
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
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const selected = tag?.trim().toLowerCase() || null;
  const recipes = await listPublished({ tag: selected });
  const selectedName = TAXONOMY_TAGS.find((item) => item.slug === selected)?.name;

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
            {selected ? (
              <Link href="/recipes" className="text-xs font-medium text-terracotta underline-offset-4 hover:underline">
                Clear
              </Link>
            ) : null}
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
                          href={`/recipes?tag=${item.slug}`}
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

        {recipes.length === 0 ? (
          <div className="flex min-h-80 flex-col items-start justify-center rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
            <h2 className="font-heading text-2xl text-teal">
              {selectedName ? `No ${selectedName.toLowerCase()} Thrive Versions yet` : "No Thrive Versions yet"}
            </h2>
            <p className="mt-3 max-w-lg text-teal/80">
              Convert a recipe you already love, then publish the short Thrive Version to this shelf.
            </p>
            <Button render={<Link href="/#thrive" />} className="mt-6 h-11 bg-terracotta-strong px-5 text-cream">
              Thrive a recipe
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { TAXONOMY_TAGS } from "@/server/taxonomy/tags";
import { Button } from "@/components/ui/button";

const filters = [
  { type: "MEAL", label: "Meal" },
  { type: "CUISINE", label: "Cuisine" },
  { type: "NUTRITION_GOAL", label: "Nutrition" },
  { type: "DIETARY", label: "Dietary" },
] as const;

export default function RecipesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
          Library
        </p>
        <h1 className="font-heading mt-2 text-4xl text-teal">Recipes</h1>
        <p className="mt-3 text-lg leading-8 text-teal/80">
          Public Thrive Versions will live here: short, attributed, and honest about
          what changed. The catalog is empty until the first conversions are published.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6 rounded-2xl bg-white/70 p-4 ring-1 ring-teal/10">
          <p className="text-sm font-medium text-teal">Browse</p>
          {filters.map((group) => (
            <div key={group.type}>
              <p className="text-xs font-semibold tracking-wide text-teal/60 uppercase">
                {group.label}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {TAXONOMY_TAGS.filter((tag) => tag.type === group.type)
                  .slice(0, 6)
                  .map((tag) => (
                    <li key={tag.slug}>
                      <span className="inline-flex rounded-full bg-sage/20 px-3 py-1 text-xs text-teal">
                        {tag.name}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </aside>

        <div className="flex min-h-80 flex-col items-start justify-center rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
          <h2 className="font-heading text-2xl text-teal">No Thrive Versions yet</h2>
          <p className="mt-3 max-w-lg text-teal/80">
            Convert a recipe you already love. After confirmation, nutrition, and a
            careful rewrite, you can publish a short Thrive Version to this shelf.
          </p>
          <Button
            render={<Link href="/#thrive" />}
            className="mt-6 h-11 bg-terracotta-strong px-5 text-cream"
          >
            Thrive a recipe
          </Button>
        </div>
      </div>
    </div>
  );
}

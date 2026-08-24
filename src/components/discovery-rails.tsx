import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { getRatingSummaries } from "@/server/community/store";
import { listPublished } from "@/server/library/store";
import type { PublishedRecipe } from "@/server/library/schema";

const RAILS = [
  {
    title: "Community Tested",
    tag: "community-tested",
    empty:
      "Cook a published Thrive Version, then rate taste and texture. Three kitchens at 4 or higher who would make it again earn this badge.",
  },
  {
    title: "Recently Thrived",
    tag: null,
    empty: "New Thrive Versions land here after they are published.",
  },
  {
    title: "Comfort food, reworked",
    tag: "comfort-food",
    empty: "The dishes people refuse to give up — fried chicken, mac and cheese, biscuits — treated with respect.",
  },
  {
    title: "High protein",
    tag: "higher-protein",
    empty: "Dinners that already eat like dinner, with more staying power.",
  },
  {
    title: "Better baking",
    tag: "better-baking",
    empty: "Cakes, breads, and cookies where structure matters as much as sugar.",
  },
  {
    title: "Weeknight meals",
    tag: "weeknight",
    empty: "Tuesday food. One pan when we can. Flavor first.",
  },
  {
    title: "Biggest nutrition improvements",
    tag: "more-fiber",
    empty: "When a small technique change moves calories, sodium, or fiber in a meaningful way.",
  },
] as const;

function pick(
  recipes: PublishedRecipe[],
  tag: string | null,
  testedSlugs: Set<string>,
) {
  if (tag === "community-tested") {
    return recipes.filter((recipe) => testedSlugs.has(recipe.slug)).slice(0, 3);
  }
  const filtered = tag ? recipes.filter((recipe) => recipe.tags.includes(tag)) : recipes;
  return filtered.slice(0, 3);
}

export async function DiscoveryRails() {
  const recipes = await listPublished();
  const summaries = await getRatingSummaries(recipes.map((recipe) => recipe.slug));
  const testedSlugs = new Set(
    Object.values(summaries)
      .filter((summary) => summary.communityTested)
      .map((summary) => summary.slug),
  );

  return (
    <section aria-labelledby="discover-heading" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-terracotta uppercase">From the library</p>
          <h2 id="discover-heading" className="font-heading mt-1 text-3xl text-teal">
            Recipes worth keeping
          </h2>
        </div>
        <Link
          href="/recipes"
          className="hidden text-sm font-medium text-teal underline-offset-4 hover:underline sm:inline"
        >
          Browse all
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RAILS.map((rail) => {
          const items = pick(recipes, rail.tag, testedSlugs);
          return (
            <article
              key={rail.title}
              className="rounded-2xl border border-teal/10 bg-white/70 p-5 shadow-[0_10px_30px_-24px_rgba(61,90,128,0.6)]"
            >
              <h3 className="font-heading text-xl text-teal">{rail.title}</h3>
              {items.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-teal/80">{rail.empty}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {items.map((recipe) => (
                    <li key={recipe.id}>
                      <Link href={`/recipes/${recipe.slug}`} className="block">
                        <p className="font-medium text-teal underline-offset-4 hover:underline">
                          {recipe.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-teal/75">{recipe.description}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
      {recipes[0] ? (
        <div className="pt-2">
          <p className="mb-3 text-sm font-medium text-teal/70">Latest publish</p>
          <div className="max-w-md">
            <RecipeCard recipe={recipes[0]} community={summaries[recipes[0].slug]} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

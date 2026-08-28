import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeCover } from "@/components/recipe-cover";
import { coverInputFromPublished } from "@/lib/recipe-cover";
import type { RatingSummary } from "@/server/community/policy";
import { getRatingSummaries } from "@/server/community/store";
import { listPublished } from "@/server/library/store";
import type { PublishedRecipe } from "@/server/library/schema";

const RAILS = [
  {
    title: "Community Tested",
    kind: "community-tested",
    empty:
      "Cook a published Thrive Version, then rate taste and texture. Three kitchens at 4 or higher who would make it again earn this badge.",
  },
  {
    title: "Popular",
    kind: "popular",
    empty: "Once cooks rate Thrive Versions, the ones they would make again show up here.",
  },
  {
    title: "Recently Thrived",
    kind: "recent",
    empty: "New Thrive Versions land here after they are published.",
  },
  {
    title: "Comfort food, reworked",
    kind: "tag:comfort-food",
    empty: "The dishes people refuse to give up — fried chicken, mac and cheese, biscuits — treated with respect.",
  },
  {
    title: "Southern",
    kind: "tag:southern",
    empty: "Biscuits, potluck sides, and weeknight pots that still taste like home.",
  },
  {
    title: "Desserts worth keeping",
    kind: "tag:dessert",
    empty: "Cakes, cookies, and cobblers where sugar is structure, not a default to delete.",
  },
  {
    title: "High protein",
    kind: "tag:higher-protein",
    empty: "Dinners that already eat like dinner, with more staying power.",
  },
  {
    title: "Better baking",
    kind: "tag:better-baking",
    empty: "Cakes, breads, and cookies where structure matters as much as sugar.",
  },
  {
    title: "Weeknight meals",
    kind: "tag:weeknight",
    empty: "Tuesday food. One pan when we can. Flavor first.",
  },
  {
    title: "Biggest nutrition improvements",
    kind: "tag:more-fiber",
    empty: "When a small technique change moves calories, sodium, or fiber in a meaningful way.",
  },
] as const;

function pick(
  recipes: PublishedRecipe[],
  kind: string,
  summaries: Record<string, RatingSummary>,
  testedSlugs: Set<string>,
) {
  if (kind === "community-tested") {
    return recipes.filter((recipe) => testedSlugs.has(recipe.slug)).slice(0, 3);
  }
  if (kind === "popular") {
    return [...recipes]
      .filter((recipe) => (summaries[recipe.slug]?.count ?? 0) > 0)
      .sort((a, b) => {
        const left = summaries[a.slug];
        const right = summaries[b.slug];
        const avg = (right?.overallAverage ?? 0) - (left?.overallAverage ?? 0);
        if (avg !== 0) return avg;
        return (right?.count ?? 0) - (left?.count ?? 0);
      })
      .slice(0, 3);
  }
  if (kind === "recent") return recipes.slice(0, 3);
  if (kind.startsWith("tag:")) {
    const tag = kind.slice(4);
    return recipes.filter((recipe) => recipe.tags.includes(tag)).slice(0, 3);
  }
  return recipes.slice(0, 3);
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
          const items = pick(recipes, rail.kind, summaries, testedSlugs);
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
                      <Link href={`/recipes/${recipe.slug}`} className="flex gap-3">
                        <RecipeCover
                          seed={coverInputFromPublished(recipe)}
                          size="thumb"
                          photo={recipe.image}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-teal underline-offset-4 hover:underline">
                            {recipe.title}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-sm text-teal/75">
                            {recipe.description}
                          </span>
                        </span>
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

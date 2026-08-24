import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublished } from "@/server/library/store";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const recipes = query ? await listPublished({ query }) : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6">
      <header>
        <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Search</p>
        <h1 className="font-heading mt-2 text-4xl text-teal">Find a Thrive Version</h1>
        <p className="mt-3 text-lg leading-8 text-teal/80">
          Search titles, ingredients, cuisines, and tags in the public library.
        </p>
      </header>
      <form role="search" action="/search" method="get" className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="q"
          defaultValue={query}
          placeholder="e.g. buttermilk biscuits, weeknight chicken"
          aria-label="Search recipes"
          className="h-12 flex-1 bg-white/80"
        />
        <Button type="submit" className="h-12 bg-teal px-6 text-cream">
          Search
        </Button>
      </form>

      {!query ? (
        <p className="rounded-2xl bg-white/70 p-4 text-sm text-teal/80 ring-1 ring-teal/10">
          Try a dish you already cook. Results only include Thrive Versions someone published.
        </p>
      ) : recipes.length === 0 ? (
        <p className="rounded-2xl bg-white/70 p-4 text-sm text-teal/80 ring-1 ring-teal/10">
          Nothing published matches “{query}”. Thrive a recipe and publish it if you want it
          findable here.
        </p>
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-teal/70">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

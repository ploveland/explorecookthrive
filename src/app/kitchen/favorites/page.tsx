import Link from "next/link";
import { KitchenNav } from "@/components/kitchen-nav";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { listFavoriteSlugs } from "@/server/accounts/favorites";
import { currentAccount } from "@/server/accounts/session";
import { getPublishedBySlug } from "@/server/library/store";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const account = await currentAccount();

  if (!account.userId) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
        <KitchenNav />
        <div className="rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
          <h2 className="font-heading text-2xl text-teal">Sign in to favorite recipes</h2>
          <p className="mt-3 max-w-lg text-teal/80">
            Favorites are tied to an account so they survive beyond a guest cookie.
          </p>
          <Button render={<Link href="/signin?next=/kitchen/favorites" />} className="mt-6 h-11 bg-terracotta-strong px-5 text-cream">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const slugs = await listFavoriteSlugs(account.userId);
  const recipes = (await Promise.all(slugs.map((slug) => getPublishedBySlug(slug)))).filter(
    (recipe) => recipe !== null,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
      <KitchenNav />
      {recipes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
          <h2 className="font-heading text-2xl text-teal">No favorites yet</h2>
          <p className="mt-3 max-w-lg text-teal/80">
            Open a public Thrive Version and save it. We only favorite published recipes, not private drafts.
          </p>
          <Button render={<Link href="/recipes" />} className="mt-6 h-11 bg-terracotta-strong px-5 text-cream">
            Browse the library
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
  );
}

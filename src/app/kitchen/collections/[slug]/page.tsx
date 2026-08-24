import Link from "next/link";
import { notFound } from "next/navigation";
import { KitchenNav } from "@/components/kitchen-nav";
import { RecipeCard } from "@/components/recipe-card";
import { getCollectionForUser } from "@/server/accounts/collections";
import { currentAccount } from "@/server/accounts/session";
import { getPublishedBySlug } from "@/server/library/store";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const account = await currentAccount();
  if (!account.userId) notFound();
  const { slug } = await params;
  const collection = await getCollectionForUser(account.userId, slug);
  if (!collection) notFound();

  const recipes = (
    await Promise.all(collection.recipeSlugs.map((recipeSlug) => getPublishedBySlug(recipeSlug)))
  ).filter((recipe) => recipe !== null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
      <KitchenNav />
      <div>
        <p className="text-sm text-teal/70">
          <Link href="/kitchen/collections" className="underline-offset-4 hover:underline">
            Collections
          </Link>
        </p>
        <h2 className="font-heading mt-2 text-3xl text-teal">{collection.name}</h2>
      </div>
      {recipes.length === 0 ? (
        <p className="text-sm text-teal/75">This collection is empty. Add a recipe from a public Thrive Version.</p>
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

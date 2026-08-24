import Link from "next/link";
import { KitchenNav } from "@/components/kitchen-nav";
import { CreateCollectionForm } from "@/components/create-collection-form";
import { Button } from "@/components/ui/button";
import { listCollections } from "@/server/accounts/collections";
import { currentAccount } from "@/server/accounts/session";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const account = await currentAccount();

  if (!account.userId) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
        <KitchenNav />
        <div className="rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
          <h2 className="font-heading text-2xl text-teal">Sign in to keep collections</h2>
          <p className="mt-3 max-w-lg text-teal/80">
            Weeknight pots, biscuits you will actually bake, the high-protein shelf — named lists live on an account.
          </p>
          <Button render={<Link href="/signin?next=/kitchen/collections" />} className="mt-6 h-11 bg-terracotta-strong px-5 text-cream">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const collections = await listCollections(account.userId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
      <KitchenNav />
      <CreateCollectionForm />
      {collections.length === 0 ? (
        <p className="text-sm text-teal/75">No collections yet. Name one above.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                href={`/kitchen/collections/${collection.slug}`}
                className="block rounded-2xl bg-white/80 p-5 ring-1 ring-teal/10 hover:ring-terracotta/40"
              >
                <h2 className="font-heading text-2xl text-teal">{collection.name}</h2>
                <p className="mt-2 text-sm text-teal/70">
                  {collection.recipeSlugs.length}{" "}
                  {collection.recipeSlugs.length === 1 ? "recipe" : "recipes"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

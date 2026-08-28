import Link from "next/link";
import { KitchenNav } from "@/components/kitchen-nav";
import { KitchenHistory } from "@/components/kitchen-history";
import { Button } from "@/components/ui/button";
import { currentAccount } from "@/server/accounts/session";
import { guestConversionLimit } from "@/server/accounts/policy";
import { listJobsForAccount } from "@/server/convert/jobs";
import { indexPublishedSlugs } from "@/server/library/store";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const account = await currentAccount();
  const jobs = await listJobsForAccount({ userId: account.userId, guestId: account.guestId });
  const publishedSlugs = Object.fromEntries(await indexPublishedSlugs());

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
      <KitchenNav />
      {!account.user ? (
        <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-teal ring-1 ring-sage/40">
          {guestConversionLimit() > 0
            ? "A few conversions without an account. After that we will ask you to sign in. "
            : "Guest conversions land here for a while. "}
          <Link className="font-medium underline-offset-4 hover:underline" href="/signin?next=/kitchen">
            Sign in
          </Link>{" "}
          to keep them, favorite recipes, and save Thrive Versions to the library.
        </p>
      ) : null}

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
          <h2 className="font-heading text-2xl text-teal">No conversions yet</h2>
          <p className="mt-3 max-w-lg text-teal/80">
            Paste a recipe you already cook. Each original keeps every Thrive Version you try, so
            you can compare goals side by side.
          </p>
          <Button render={<Link href="/#thrive" />} className="mt-6 h-11 bg-terracotta-strong px-5 text-cream">
            Thrive a recipe
          </Button>
        </div>
      ) : (
        <KitchenHistory jobs={jobs} publishedSlugs={publishedSlugs} />
      )}
    </div>
  );
}

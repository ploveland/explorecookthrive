import Link from "next/link";
import { KitchenNav } from "@/components/kitchen-nav";
import { Button } from "@/components/ui/button";
import { currentAccount } from "@/server/accounts/session";
import { listJobsForAccount } from "@/server/convert/jobs";
import { getPublishedByJobId } from "@/server/library/store";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const account = await currentAccount();
  const jobs = await listJobsForAccount({ userId: account.userId, guestId: account.guestId });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
      <KitchenNav />
      {!account.user ? (
        <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-teal ring-1 ring-sage/40">
          Two conversions without an account. After that we will ask you to sign in.{" "}
          <Link className="font-medium underline-offset-4 hover:underline" href="/signin?next=/kitchen">
            Sign in
          </Link>
        </p>
      ) : null}

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal/25 bg-white/50 p-8">
          <h2 className="font-heading text-2xl text-teal">No conversions yet</h2>
          <p className="mt-3 max-w-lg text-teal/80">
            Paste a recipe you already cook. The Thrive Version will show up here so you can come back to it.
          </p>
          <Button render={<Link href="/#thrive" />} className="mt-6 h-11 bg-terracotta-strong px-5 text-cream">
            Thrive a recipe
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {await Promise.all(
            jobs.map(async (job) => {
              const published = await getPublishedByJobId(job.id);
              return (
                <li key={job.id} className="rounded-2xl bg-white/80 p-5 ring-1 ring-teal/10">
                  <p className="text-xs font-semibold tracking-wide text-teal/60 uppercase">
                    {job.status === "complete" ? "Thrive Version" : job.statusLabel}
                  </p>
                  <h2 className="font-heading mt-1 text-2xl text-teal">
                    {job.output?.thriveVersion.title ?? job.recipe.title}
                  </h2>
                  <p className="mt-1 text-sm text-teal/70">
                    {new Date(job.createdAt).toLocaleString()} · {job.provider === "mock" ? "Culinary mock" : "OpenAI"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.status === "complete" ? (
                      <Button render={<Link href={`/convert/result/${job.id}`} />} variant="outline">
                        Open private result
                      </Button>
                    ) : (
                      <Button render={<Link href={`/convert/working/${job.id}`} />} variant="outline">
                        Check progress
                      </Button>
                    )}
                    {job.status === "complete" || job.status === "failed" ? (
                      <Button render={<Link href={`/convert/again/${job.id}`} />} variant="outline">
                        Thrive again
                      </Button>
                    ) : null}
                    {published ? (
                      <Button render={<Link href={`/recipes/${published.slug}`} />} className="bg-teal text-cream">
                        Public page
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            }),
          )}
        </ul>
      )}
    </div>
  );
}

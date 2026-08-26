import { notFound, redirect } from "next/navigation";
import { ConvertResult } from "@/components/convert-result";
import { RecipeCover } from "@/components/recipe-cover";
import { currentAccount } from "@/server/accounts/session";
import { getJob, listRelatedJobs } from "@/server/convert/jobs";
import { completeVersions, versionNumberFor } from "@/server/convert/versions";
import { recipeIsShareable, recipeShareUrl } from "@/server/library/share";
import { getPublishedByJobId } from "@/server/library/store";
import { coverInputFromJob } from "@/lib/recipe-cover";

export const dynamic = "force-dynamic";

export default async function ConvertResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getJob(jobId);
  if (!job) notFound();
  if (job.status !== "complete" || !job.output) {
    redirect(`/convert/working/${jobId}`);
  }

  const published = await getPublishedByJobId(job.id);
  const account = await currentAccount();
  const related = await listRelatedJobs(job);
  const siblings = completeVersions(related);
  const versionNumber = versionNumberFor(related, job.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6">
      <RecipeCover seed={coverInputFromJob(job)} size="hero">
        <p className="text-sm font-semibold tracking-[0.18em] text-cream/85 uppercase">
          {versionNumber && siblings.length > 1
            ? `Thrive Version ${versionNumber} of ${siblings.length}`
            : "Thrive Version"}
        </p>
        <h1 className="font-heading mt-2 text-4xl text-balance text-cream sm:text-5xl">
          {job.output.thriveVersion.title}
        </h1>
      </RecipeCover>
      <ConvertResult
        job={{ ...job, output: job.output }}
        publishedSlug={published?.slug ?? null}
        shareUrl={
          published && recipeIsShareable(published.visibility)
            ? recipeShareUrl(published.slug)
            : null
        }
        signedIn={Boolean(account.userId)}
        versionNumber={versionNumber}
        siblings={siblings}
      />
    </div>
  );
}

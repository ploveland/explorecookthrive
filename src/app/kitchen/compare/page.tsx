import Link from "next/link";
import { notFound } from "next/navigation";
import { CompareVersions } from "@/components/compare-versions";
import { Button } from "@/components/ui/button";
import { currentAccount } from "@/server/accounts/session";
import { pairThriveJobs } from "@/server/convert/compare";
import { listJobsForAccount } from "@/server/convert/jobs";
import { versionNumberFor } from "@/server/convert/versions";

export const dynamic = "force-dynamic";

const REASON_COPY = {
  same_version: "Pick two different Thrive Versions.",
  different_original: "Those conversions are not the same original recipe.",
  not_complete: "Both versions need to finish before we can compare them.",
  different_kitchen: "Those conversions are not in this kitchen.",
} as const;

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Compare</p>
      <h1 className="font-heading text-4xl text-teal">{title}</h1>
      <p className="max-w-xl text-lg text-teal/80">{body}</p>
      <Button render={<Link href="/kitchen" />} className="h-11 w-fit bg-terracotta-strong px-5 text-cream">
        Back to kitchen
      </Button>
    </div>
  );
}

export default async function KitchenComparePage({
  searchParams,
}: {
  searchParams: Promise<{ left?: string; right?: string }>;
}) {
  const { left: leftId, right: rightId } = await searchParams;
  if (!leftId || !rightId) {
    return (
      <Message
        title="Choose two versions"
        body="Select two Thrive Versions of the same original in your kitchen, then compare."
      />
    );
  }

  const account = await currentAccount();
  const jobs = await listJobsForAccount({ userId: account.userId, guestId: account.guestId });
  const leftJob = jobs.find((job) => job.id === leftId);
  const rightJob = jobs.find((job) => job.id === rightId);
  if (!leftJob || !rightJob) notFound();

  const paired = pairThriveJobs(leftJob, rightJob);
  if (!paired.ok) {
    return <Message title="Those versions cannot be compared" body={REASON_COPY[paired.reason]} />;
  }

  const related = jobs.filter((job) => job.draftId === leftJob.draftId);
  const leftNumber = versionNumberFor(related, leftJob.id) ?? 1;
  const rightNumber = versionNumberFor(related, rightJob.id) ?? 2;
  const originalTitle = leftJob.recipe.originalTitle || leftJob.recipe.title;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Compare</p>
      <h1 className="font-heading text-4xl text-teal">
        Version {leftNumber} and Version {rightNumber}
      </h1>
      <CompareVersions
        originalTitle={originalTitle}
        left={leftJob}
        right={rightJob}
        leftNumber={leftNumber}
        rightNumber={rightNumber}
      />
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/kitchen" />} variant="outline">
          Back to kitchen
        </Button>
        <Button
          render={<Link href={`/kitchen/compare?left=${rightJob.id}&right=${leftJob.id}`} />}
          variant="outline"
        >
          Swap sides
        </Button>
      </div>
    </div>
  );
}

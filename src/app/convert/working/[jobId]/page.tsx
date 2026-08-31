import { notFound } from "next/navigation";
import { ConvertProgress } from "@/components/convert-progress";
import { currentAccount } from "@/server/accounts/session";
import { getAccessibleJob } from "@/server/convert/jobs";
import { notFoundOnInvalidId } from "@/server/http/not-found-on-invalid-id";

export default async function ConvertWorkingPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const account = await currentAccount();
  const job = await getAccessibleJob(jobId, account).catch(notFoundOnInvalidId);
  if (!job) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        Working
      </p>
      <h1 className="font-heading text-4xl text-teal">Reading {job.recipe.title}</h1>
      <p className="text-lg leading-8 text-teal/80">
        We look for upgrades that earn their keep — flavor, texture, and structure first.
      </p>
      <ConvertProgress jobId={job.id} />
    </div>
  );
}

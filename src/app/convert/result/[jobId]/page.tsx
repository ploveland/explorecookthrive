import { notFound, redirect } from "next/navigation";
import { ConvertResult } from "@/components/convert-result";
import { getJob } from "@/server/convert/jobs";

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        Thrive Version
      </p>
      <h1 className="font-heading text-4xl text-teal">{job.output.thriveVersion.title}</h1>
      <ConvertResult job={{ ...job, output: job.output }} />
    </div>
  );
}

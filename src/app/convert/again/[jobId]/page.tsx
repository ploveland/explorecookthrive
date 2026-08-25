import { notFound, redirect } from "next/navigation";
import { ensureDraftFromJob, getJob } from "@/server/convert/jobs";

export const dynamic = "force-dynamic";

export default async function ConvertAgainPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const existing = await getJob(jobId);
  if (!existing) notFound();
  const { draft, job } = await ensureDraftFromJob(existing.id);
  redirect(`/convert/goals/${draft.id}?from=${job.id}`);
}

import { notFound, redirect } from "next/navigation";
import { currentAccount } from "@/server/accounts/session";
import { ensureDraftFromJob, getAccessibleJob } from "@/server/convert/jobs";
import { notFoundOnInvalidId } from "@/server/http/not-found-on-invalid-id";

export const dynamic = "force-dynamic";

export default async function ConvertAgainPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const account = await currentAccount();
  const existing = await getAccessibleJob(jobId, account).catch(notFoundOnInvalidId);
  if (!existing) notFound();
  const { draft, job } = await ensureDraftFromJob(existing.id, account);
  redirect(`/convert/goals/${draft.id}?from=${job.id}`);
}

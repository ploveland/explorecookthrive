import { redirect } from "next/navigation";

export default async function ReadyPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  redirect(`/convert/goals/${draftId}`);
}

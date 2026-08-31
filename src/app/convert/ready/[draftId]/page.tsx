import { redirect } from "next/navigation";
import { parseStorageId } from "@/server/fs/safe-path";
import { notFoundOnInvalidId } from "@/server/http/not-found-on-invalid-id";

export default async function ReadyPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  let id: string;
  try {
    id = parseStorageId(draftId);
  } catch (error) {
    notFoundOnInvalidId(error);
  }
  redirect(`/convert/goals/${id}`);
}

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { assignJobOwner, listJobs } from "@/server/convert/jobs";
import { GUEST_COOKIE } from "./constants";
import { parseStorageId } from "../fs/safe-path";
import { assignDraftOwner } from "../drafts/store";
import { conversionGate, isSameUtcDay, remainingConversions } from "./policy";

export async function readGuestId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(GUEST_COOKIE)?.value ?? null;
  if (!raw) return null;
  try {
    return parseStorageId(raw, "uuid");
  } catch {
    return null;
  }
}

export async function currentAccount() {
  const session = await auth();
  const guestId = await readGuestId();
  const userId = session?.user?.id ?? null;
  if (userId && guestId) {
    await assignJobOwner({ guestId, userId });
    await assignDraftOwner({ guestId, userId });
  }
  return {
    user: session?.user ?? null,
    userId,
    guestId,
  };
}

export async function gateConversion() {
  const account = await currentAccount();
  const jobs = await listJobs();
  const guestConversions = account.guestId
    ? jobs.filter((job) => job.guestId === account.guestId && !job.userId).length
    : 0;
  const userConversionsToday = account.userId
    ? jobs.filter((job) => job.userId === account.userId && isSameUtcDay(job.createdAt)).length
    : 0;

  const counts = {
    userId: account.userId,
    guestConversions: account.userId ? 0 : guestConversions,
    userConversionsToday,
  };

  return {
    ...account,
    remaining: remainingConversions(counts),
    gate: conversionGate(counts),
  };
}

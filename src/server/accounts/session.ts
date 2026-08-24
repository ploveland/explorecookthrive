import { cookies } from "next/headers";
import { auth } from "@/auth";
import { assignJobOwner, listJobs } from "@/server/convert/jobs";
import { GUEST_COOKIE } from "./constants";
import { conversionGate, isSameUtcDay } from "./policy";

export async function readGuestId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GUEST_COOKIE)?.value ?? null;
}

export async function currentAccount() {
  const session = await auth();
  const guestId = await readGuestId();
  const userId = session?.user?.id ?? null;
  if (userId && guestId) {
    await assignJobOwner({ guestId, userId });
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

  return {
    ...account,
    gate: conversionGate({
      userId: account.userId,
      guestConversions: account.userId ? 0 : guestConversions,
      userConversionsToday,
    }),
  };
}

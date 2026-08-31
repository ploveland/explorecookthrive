import { NextResponse } from "next/server";
import { currentAccount } from "@/server/accounts/session";
import { hasKitchenSession } from "@/server/accounts/kitchen-access";
import { getAccessibleJob, publicJob } from "@/server/convert/jobs";
import { jsonErrorFromUnknown, notFoundResponse, sessionRequiredResponse } from "@/server/http/api-error";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const account = await currentAccount();
    if (!hasKitchenSession(account)) return sessionRequiredResponse();
    const { jobId } = await context.params;
    const job = await getAccessibleJob(jobId, account);
    if (!job) {
      return notFoundResponse("We could not find that conversion.");
    }
    return NextResponse.json(publicJob(job));
  } catch (error) {
    return jsonErrorFromUnknown(error) ?? NextResponse.json({ code: "job_failed", message: "We could not load that conversion." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getJob, publicJob } from "@/server/convert/jobs";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await getJob(jobId);
  if (!job) {
    return NextResponse.json({ message: "We could not find that conversion." }, { status: 404 });
  }
  return NextResponse.json(publicJob(job));
}

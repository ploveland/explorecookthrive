import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { gateConversion } from "@/server/accounts/session";
import { JobError, createJob, startJob } from "@/server/convert/jobs";
import { convertRequestSchema } from "@/server/convert/schema";
import { log } from "@/server/log";

export async function POST(request: Request) {
  try {
    const gated = await gateConversion();
    if (!gated.gate.ok) {
      log.warn("convert.rate_limited", {
        code: gated.gate.code,
        remaining: gated.remaining,
        signedIn: Boolean(gated.userId),
      });
      return NextResponse.json(
        { code: gated.gate.code, message: gated.gate.message },
        { status: 403 },
      );
    }
    const body = await request.json();
    const input = convertRequestSchema.parse(body);
    const job = await createJob({
      ...input,
      guestId: gated.guestId,
      userId: gated.userId,
    });
    startJob(job.id);
    log.info("convert.job_started", {
      jobId: job.id,
      signedIn: Boolean(gated.userId),
      remaining: gated.remaining - 1,
    });
    return NextResponse.json({ jobId: job.id, status: job.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          code: "invalid_input",
          message: error.issues[0]?.message ?? "Pick a goal and try again.",
        },
        { status: 400 },
      );
    }
    if (error instanceof JobError && error.code === "draft_not_found") {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 404 });
    }
    return NextResponse.json(
      {
        code: "convert_failed",
        message: "We could not start that conversion. Try again in a moment.",
      },
      { status: 500 },
    );
  }
}

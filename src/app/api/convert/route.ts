import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { JobError, createJob, startJob } from "@/server/convert/jobs";
import { convertRequestSchema } from "@/server/convert/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = convertRequestSchema.parse(body);
    const job = await createJob(input);
    startJob(job.id);
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

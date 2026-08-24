import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { currentAccount } from "@/server/accounts/session";
import { getJob } from "@/server/convert/jobs";
import { LibraryError, getPublishedByJobId, publishFromJob } from "@/server/library/store";

const bodySchema = z.object({
  jobId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const account = await currentAccount();
    if (!account.userId || !account.user) {
      return NextResponse.json(
        {
          code: "sign_in_required",
          message: "Sign in to publish a Thrive Version to the public library.",
        },
        { status: 401 },
      );
    }
    const body = bodySchema.parse(await request.json());
    const job = await getJob(body.jobId);
    if (!job) {
      return NextResponse.json(
        { code: "job_not_found", message: "We could not find that conversion." },
        { status: 404 },
      );
    }
    const existing = await getPublishedByJobId(job.id);
    const recipe =
      existing ??
      (await publishFromJob(job, {
        ownerId: account.user.id,
        ownerName: account.user.name,
      }));
    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath("/search");
    revalidatePath("/kitchen");
    revalidatePath(`/recipes/${recipe.slug}`);
    revalidatePath(`/convert/result/${job.id}`);
    return NextResponse.json({
      slug: recipe.slug,
      alreadyPublished: Boolean(existing),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "invalid_input", message: "Choose a finished Thrive Version to publish." },
        { status: 400 },
      );
    }
    if (error instanceof LibraryError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { code: "publish_failed", message: "We could not publish that recipe. Try again in a moment." },
      { status: 500 },
    );
  }
}

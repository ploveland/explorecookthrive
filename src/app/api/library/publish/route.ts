import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { currentAccount } from "@/server/accounts/session";
import { getAccessibleJob } from "@/server/convert/jobs";
import { storageUuidSchema } from "@/server/fs/ids";
import { jsonErrorFromUnknown } from "@/server/http/api-error";
import { LibraryError, getPublishedByJobId, publishFromJob } from "@/server/library/store";
import { log } from "@/server/log";

const bodySchema = z.object({
  jobId: storageUuidSchema,
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
    const job = await getAccessibleJob(body.jobId, account);
    if (!job) {
      return NextResponse.json(
        { code: "job_not_found", message: "We could not find that conversion." },
        { status: 404 },
      );
    }
    const existing = await getPublishedByJobId(job.id);
    const recipe = await publishFromJob(job, {
      ownerId: account.user.id,
      ownerName: account.user.name,
    });
    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath("/search");
    revalidatePath("/kitchen");
    revalidatePath(`/recipes/${recipe.slug}`);
    revalidatePath(`/convert/result/${job.id}`);
    log.info("library.publish", {
      slug: recipe.slug,
      alreadyPublished: Boolean(existing),
      visibility: recipe.visibility,
    });
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
      const status = error.code === "not_owner" ? 403 : 409;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }
    return (
      jsonErrorFromUnknown(error) ??
      NextResponse.json(
        { code: "publish_failed", message: "We could not publish that recipe. Try again in a moment." },
        { status: 500 },
      )
    );
  }
}

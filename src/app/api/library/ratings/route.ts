import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { currentAccount } from "@/server/accounts/session";
import { RatingError, upsertRating } from "@/server/community/store";
import { getVisibleBySlug } from "@/server/library/store";
import { log } from "@/server/log";

const bodySchema = z.object({
  slug: z.string().min(1),
  taste: z.number().int().min(1).max(5),
  texture: z.number().int().min(1).max(5),
  wouldMakeAgain: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const account = await currentAccount();
    if (!account.userId) {
      return NextResponse.json(
        { code: "sign_in_required", message: "Sign in to rate a Thrive Version after you cook it." },
        { status: 401 },
      );
    }
    const body = bodySchema.parse(await request.json());
    const recipe = await getVisibleBySlug(body.slug, account.userId);
    if (!recipe) {
      return NextResponse.json(
        { code: "not_found", message: "We could not find that recipe." },
        { status: 404 },
      );
    }
    const result = await upsertRating({
      slug: recipe.slug,
      userId: account.userId,
      ownerId: recipe.ownerId,
      visibility: recipe.visibility,
      taste: body.taste,
      texture: body.texture,
      wouldMakeAgain: body.wouldMakeAgain,
    });
    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath("/search");
    revalidatePath(`/recipes/${recipe.slug}`);
    log.info("library.rated", {
      slug: recipe.slug,
      ratingCount: result.summary.count,
      communityTested: result.summary.communityTested,
    });
    return NextResponse.json({
      summary: result.summary,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "invalid_input", message: "Rate taste and texture from 1 to 5." },
        { status: 400 },
      );
    }
    if (error instanceof RatingError) {
      const status = error.code === "owner_cannot_rate" || error.code === "not_rateable" ? 403 : 400;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }
    return NextResponse.json(
      { code: "rate_failed", message: "We could not save that rating. Try again in a moment." },
      { status: 500 },
    );
  }
}

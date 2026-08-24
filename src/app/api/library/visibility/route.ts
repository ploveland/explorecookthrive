import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAccount } from "@/server/accounts/session";
import { setRecipeVisibility } from "@/server/library/store";

const bodySchema = z.object({
  slug: z.string().min(1),
  visibility: z.enum(["public", "unlisted", "private"]),
});

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account.userId) {
    return NextResponse.json(
      { code: "sign_in_required", message: "Sign in to change who can see this recipe." },
      { status: 401 },
    );
  }
  const body = bodySchema.parse(await request.json());
  const recipe = await setRecipeVisibility(body.slug, account.userId, body.visibility);
  if (!recipe) {
    return NextResponse.json(
      { code: "not_owner", message: "Only the person who published this can change visibility." },
      { status: 403 },
    );
  }
  revalidatePath("/");
  revalidatePath("/recipes");
  revalidatePath("/search");
  revalidatePath("/kitchen");
  revalidatePath(`/recipes/${recipe.slug}`);
  return NextResponse.json({ slug: recipe.slug, visibility: recipe.visibility });
}

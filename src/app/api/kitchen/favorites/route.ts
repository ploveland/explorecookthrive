import { NextResponse } from "next/server";
import { z } from "zod";
import { FavoriteError, toggleFavorite } from "@/server/accounts/favorites";
import { currentAccount } from "@/server/accounts/session";
import { publicSlugSchema } from "@/server/fs/ids";

const bodySchema = z.object({
  slug: publicSlugSchema,
});

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account.userId) {
    return NextResponse.json(
      { code: "sign_in_required", message: "Sign in to save favorites." },
      { status: 401 },
    );
  }
  try {
    const body = bodySchema.parse(await request.json());
    const result = await toggleFavorite(account.userId, body.slug);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FavoriteError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 404 });
    }
    throw error;
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { toggleFavorite } from "@/server/accounts/favorites";
import { currentAccount } from "@/server/accounts/session";

const bodySchema = z.object({
  slug: z.string().min(1),
});

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account.userId) {
    return NextResponse.json(
      { code: "sign_in_required", message: "Sign in to save favorites." },
      { status: 401 },
    );
  }
  const body = bodySchema.parse(await request.json());
  const result = await toggleFavorite(account.userId, body.slug);
  return NextResponse.json(result);
}

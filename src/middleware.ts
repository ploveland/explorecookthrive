import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GUEST_COOKIE } from "@/server/accounts/constants";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(GUEST_COOKIE)) {
    response.cookies.set({
      name: GUEST_COOKIE,
      value: crypto.randomUUID(),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|favicon.ico).*)"],
};

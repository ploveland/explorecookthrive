"use server";

import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { AUTH_NEXT_COOKIE } from "@/server/accounts/constants";
import { confirmGoogleLink, googleAuthConfigured } from "@/server/accounts/google";
import { AccountError, createUser, getUserByEmail } from "@/server/accounts/users";

function nextPath(value: FormDataEntryValue | null) {
  const next = String(value ?? "/kitchen");
  return next.startsWith("/") ? next : "/kitchen";
}

async function passwordSignInFailure(email: string) {
  const user = await getUserByEmail(email);
  if (user?.googleId && !user.passwordHash) {
    return "This kitchen uses Google. Continue with Google, or use Forgot password to set a password.";
  }
  return "Those details did not match a kitchen. Check the email and password.";
}

export async function signInAction(_prev: string | null, formData: FormData) {
  const next = nextPath(formData.get("next"));
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: next,
    });
    return null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return passwordSignInFailure(email);
    }
    throw error;
  }
}

export async function signUpAction(_prev: string | null, formData: FormData) {
  const next = nextPath(formData.get("next"));
  if (String(formData.get("website") ?? "").trim()) {
    return "We could not create that kitchen. Try again in a moment.";
  }
  try {
    await createUser({
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: next,
    });
    return null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AccountError) return error.message;
    if (error instanceof AuthError) {
      return "Your kitchen was created. Sign in with the same email and password.";
    }
    throw error;
  }
}

export async function signInWithGoogle(formData: FormData) {
  if (!googleAuthConfigured()) {
    redirect("/signin");
  }
  const next = nextPath(formData.get("next"));
  const jar = await cookies();
  jar.set(AUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  await signIn("google", { redirectTo: next });
}

export async function confirmGoogleLinkAction(_prev: string | null, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const { user, next } = await confirmGoogleLink(token, password);
    await signIn("credentials", {
      email: user.email,
      password,
      redirectTo: next,
    });
    return null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AccountError) return error.message;
    if (error instanceof AuthError) {
      return "Google is connected. Sign in with your email and password.";
    }
    throw error;
  }
}

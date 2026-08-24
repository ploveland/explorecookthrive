"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { AccountError, createUser } from "@/server/accounts/users";

function nextPath(value: FormDataEntryValue | null) {
  const next = String(value ?? "/kitchen");
  return next.startsWith("/") ? next : "/kitchen";
}

export async function signInAction(_prev: string | null, formData: FormData) {
  const next = nextPath(formData.get("next"));
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: next,
    });
    return null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return "Those details did not match a kitchen. Check the email and password.";
    }
    throw error;
  }
}

export async function signUpAction(_prev: string | null, formData: FormData) {
  const next = nextPath(formData.get("next"));
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

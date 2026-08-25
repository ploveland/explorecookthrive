"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { AccountError } from "@/server/accounts/users";
import { consumePasswordReset } from "@/server/accounts/reset";

export type ResetPasswordState = { error: string } | null;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) {
    return { error: "Those passwords do not match." };
  }
  try {
    await consumePasswordReset(token, password);
    redirect("/signin?reason=reset");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AccountError) return { error: error.message };
    throw error;
  }
}

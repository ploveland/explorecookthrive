"use server";

import { requestPasswordReset } from "@/server/accounts/reset";

export type ForgotPasswordState = {
  ok: true;
  previewUrl: string | null;
};

export async function forgotPasswordAction(
  _prev: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "");
  const result = await requestPasswordReset(email);
  return { ok: true, previewUrl: result.previewUrl ?? null };
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ResetPasswordState } from "@/app/reset-password/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    null as ResetPasswordState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="h-11 bg-white/80"
        />
        <p className="text-xs text-teal/70">At least 8 characters. We store a hash, not the password.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="h-11 bg-white/80"
        />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full bg-terracotta-strong text-cream"
      >
        {pending ? "Saving…" : "Save new password"}
      </Button>
      <p className="text-sm text-teal/75">
        Link expired?{" "}
        <Link className="font-medium underline-offset-4 hover:underline" href="/forgot-password">
          Request another
        </Link>
      </p>
    </form>
  );
}

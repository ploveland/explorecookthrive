"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, type ForgotPasswordState } from "@/app/forgot-password/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null as ForgotPasswordState | null);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <p className="text-lg leading-8 text-teal/80" role="status">
          If that email has a kitchen on this host, we sent a reset link. It expires in an hour.
        </p>
        {state.previewUrl ? (
          <p className="rounded-2xl border border-sage/40 bg-white/70 px-4 py-3 text-sm leading-6 text-teal">
            Mail isn’t configured on this machine, so here is the link for local recovery:{" "}
            <Link className="font-medium underline-offset-4 hover:underline" href={state.previewUrl}>
              Choose a new password
            </Link>
          </p>
        ) : null}
        <p className="text-sm text-teal/75">
          <Link className="font-medium underline-offset-4 hover:underline" href="/signin">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11 bg-white/80"
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full bg-terracotta-strong text-cream"
      >
        {pending ? "Sending…" : "Send a reset link"}
      </Button>
      <p className="text-sm text-teal/75">
        Remembered it?{" "}
        <Link className="font-medium underline-offset-4 hover:underline" href="/signin">
          Sign in
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmGoogleLinkAction } from "@/app/signin/actions";

export function ConnectGoogleForm({ token, email }: { token: string; email: string }) {
  const [error, formAction, pending] = useActionState(confirmGoogleLinkAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">Password for {email}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="h-11 bg-white/80"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full bg-terracotta-strong text-cream"
      >
        {pending ? "Connecting…" : "Connect Google"}
      </Button>
      <p className="text-sm text-teal/75">
        <Link className="font-medium underline-offset-4 hover:underline" href="/signin">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, signUpAction } from "@/app/signin/actions";

export function AuthForm({
  mode,
  next,
}: {
  mode: "signin" | "signup";
  next: string;
}) {
  const action = mode === "signin" ? signInAction : signUpAction;
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {mode === "signup" ? (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required autoComplete="name" className="h-11 bg-white/80" />
        </div>
      ) : null}
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
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="h-11 bg-white/80"
        />
        {mode === "signup" ? (
          <p className="text-xs text-teal/70">At least 8 characters. We store a hash, not the password.</p>
        ) : (
          <p className="text-sm text-teal/75">
            <Link className="font-medium underline-offset-4 hover:underline" href="/forgot-password">
              Forgot your password?
            </Link>
          </p>
        )}
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
        {pending ? "Working…" : mode === "signup" ? "Create a kitchen" : "Sign in"}
      </Button>
      <p className="text-sm text-teal/75">
        {mode === "signup" ? (
          <>
            Already have a kitchen?{" "}
            <Link className="font-medium underline-offset-4 hover:underline" href={`/signin?next=${encodeURIComponent(next)}`}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link className="font-medium underline-offset-4 hover:underline" href={`/signup?next=${encodeURIComponent(next)}`}>
              Create a kitchen
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

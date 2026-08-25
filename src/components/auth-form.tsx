"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, signInWithGoogle, signUpAction } from "@/app/signin/actions";

function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant="outline"
      className="h-11 w-full border-teal/20 bg-white/80 text-teal"
    >
      {pending ? "Opening Google…" : "Continue with Google"}
    </Button>
  );
}

export function AuthForm({
  mode,
  next,
  googleEnabled = false,
}: {
  mode: "signin" | "signup";
  next: string;
  googleEnabled?: boolean;
}) {
  const action = mode === "signin" ? signInAction : signUpAction;
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <div className="space-y-6">
      {googleEnabled ? (
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <GoogleSubmitButton />
        </form>
      ) : null}
      {googleEnabled ? (
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-teal/15" />
          </div>
          <div className="relative flex justify-center text-xs font-semibold tracking-[0.18em] text-teal/55 uppercase">
            <span className="bg-cream px-2">or</span>
          </div>
        </div>
      ) : null}
      <form action={formAction} className="relative space-y-4">
        <input type="hidden" name="next" value={next} />
        {mode === "signup" ? (
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
        ) : null}
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
    </div>
  );
}

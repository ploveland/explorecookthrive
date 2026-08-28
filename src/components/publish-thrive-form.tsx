"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublishThriveForm({
  jobId,
  publishedSlug,
  signedIn,
  variant = "hero",
}: {
  jobId: string;
  publishedSlug: string | null;
  signedIn: boolean;
  variant?: "hero" | "followup";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const next = `/convert/result/${jobId}`;

  if (publishedSlug) {
    if (variant === "followup") return null;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sage/15 px-4 py-4 ring-1 ring-sage/40">
        <p className="text-sm text-teal/80">This Thrive Version is on the public library shelf.</p>
        <Button
          type="button"
          className="h-11 bg-terracotta-strong px-5 text-cream"
          onClick={() => router.push(`/recipes/${publishedSlug}`)}
        >
          View in the library
        </Button>
      </div>
    );
  }

  async function onPublish() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/library/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        slug?: string;
        message?: string;
      } | null;
      if (!response.ok || !payload?.slug) {
        setError(payload?.message ?? "We could not save that recipe to the library.");
        return;
      }
      router.push(`/recipes/${payload.slug}`);
      router.refresh();
    } catch {
      setError("We could not reach the server. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  const heading =
    variant === "followup" ? "Ready to save this to the library?" : "Save this to the library";
  const body = signedIn
    ? variant === "followup"
      ? "The rewrite stays in your kitchen either way. Saving it puts this Thrive Version on the public shelf for other kitchens."
      : "The public library is where other kitchens find Thrive Versions. Saving this one puts your rewrite, what changed, and USDA estimates on that shelf — not the original recipe."
    : "Sign in so this Thrive Version has an owner, then save it to the public library. You can take it down later.";

  return (
    <div
      id={variant === "hero" ? "save-to-library" : undefined}
      className={cn(
        "scroll-mt-28 space-y-4 rounded-3xl px-5 py-5 sm:px-6 sm:py-6",
        variant === "hero"
          ? "bg-white ring-2 ring-terracotta shadow-[0_18px_40px_-28px_rgba(196,92,67,0.55)]"
          : "bg-white/90 ring-1 ring-terracotta/40",
      )}
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-terracotta uppercase">Library</p>
      <p className="font-heading text-2xl text-teal sm:text-3xl">{heading}</p>
      <p className="max-w-2xl text-sm leading-6 text-teal/80 sm:text-base sm:leading-7">{body}</p>
      {signedIn ? (
        <Button
          type="button"
          disabled={pending}
          onClick={() => void onPublish()}
          className="h-12 w-full bg-terracotta-strong px-6 text-base text-cream sm:w-auto"
        >
          {pending ? "Saving…" : "Save to the library"}
        </Button>
      ) : (
        <Button
          render={<Link href={`/signin?next=${encodeURIComponent(`${next}#save-to-library`)}`} />}
          className="h-12 w-full bg-terracotta-strong px-6 text-base text-cream sm:w-auto"
        >
          Sign in to save it
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

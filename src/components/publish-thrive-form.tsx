"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PublishThriveForm({
  jobId,
  publishedSlug,
  signedIn,
}: {
  jobId: string;
  publishedSlug: string | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const next = `/convert/result/${jobId}`;

  if (publishedSlug) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-teal/80">This Thrive Version is on the library shelf.</p>
        <Button
          type="button"
          className="bg-terracotta-strong text-cream"
          onClick={() => router.push(`/recipes/${publishedSlug}`)}
        >
          View in the library
        </Button>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="space-y-3 rounded-2xl bg-white/80 px-4 py-4 ring-1 ring-teal/10">
        <p className="font-heading text-xl text-teal">Share a short Thrive Version</p>
        <p className="text-sm leading-6 text-teal/80">
          Publishing puts this rewrite on the public shelf. Sign in so the recipe has an owner,
          and so you can unpublish it later.
        </p>
        <Button render={<Link href={`/signin?next=${encodeURIComponent(next)}`} />} className="bg-terracotta-strong text-cream">
          Sign in to publish
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
        setError(payload?.message ?? "We could not publish that recipe.");
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

  return (
    <div className="space-y-3 rounded-2xl bg-white/80 px-4 py-4 ring-1 ring-teal/10">
      <p className="font-heading text-xl text-teal">Share a short Thrive Version</p>
      <p className="text-sm leading-6 text-teal/80">
        Publishing puts this rewrite on the public shelf: ingredients, steps, what changed, and
        USDA estimates. We attribute the original title. We do not republish a full imported
        original recipe.
      </p>
      <Button
        type="button"
        disabled={pending}
        onClick={() => void onPublish()}
        className="bg-terracotta-strong text-cream"
      >
        {pending ? "Publishing…" : "Publish to the library"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { recipeShareCopy, recipeShareMailto } from "@/server/library/share";
import type { PublishedRecipe } from "@/server/library/schema";

export function RecipeShare({
  title,
  url,
  visibility = "public",
}: {
  title: string;
  url: string;
  visibility?: PublishedRecipe["visibility"];
}) {
  const payload = recipeShareCopy({ title, url });
  const mailto = recipeShareMailto({ title, url });
  const [message, setMessage] = useState<string | null>(null);
  const [nativeShare, setNativeShare] = useState(false);

  useEffect(() => {
    setNativeShare(typeof navigator.share === "function");
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage("Copy the link from the address bar, or use Email.");
    }
  }

  async function shareNative() {
    setMessage(null);
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      await copyLink();
    }
  }

  return (
    <section className="space-y-3 rounded-2xl bg-white/80 p-4 ring-1 ring-teal/10 sm:p-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-teal/60 uppercase">Share</p>
        <h2 className="font-heading mt-1 text-xl text-teal">Send this Thrive Version</h2>
        <p className="mt-1 text-sm leading-6 text-teal/75">
          {visibility === "unlisted"
            ? "This is an unlisted link — not in the public library. Anyone with it can open the Thrive Version."
            : "Copy the public link, share it from your phone, or email it. We send the Thrive Version, not the original recipe."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {nativeShare ? (
          <Button
            type="button"
            className="h-11 bg-teal px-5 text-cream"
            onClick={() => void shareNative()}
          >
            Share
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="h-11 px-5" onClick={() => void copyLink()}>
          Copy link
        </Button>
        <Button type="button" variant="outline" className="h-11 px-5" render={<a href={mailto} />}>
          Email
        </Button>
      </div>
      {message ? (
        <p role="status" className="text-sm text-teal/75">
          {message}
        </p>
      ) : null}
    </section>
  );
}

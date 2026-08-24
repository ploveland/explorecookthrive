"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CommunityBadge, communityTestedCopy } from "@/components/community-badge";
import type { RecipeRating, RatingSummary } from "@/server/community/policy";
import { COMMUNITY_TESTED_MIN_RATINGS } from "@/server/community/policy";
import { cn } from "@/lib/utils";

const TASTE_COPY = {
  legend: "Taste — did it still taste like the dish?",
  low: "Lost the dish",
  high: "Still itself",
};

const TEXTURE_COPY = {
  legend: "Texture — did the swap hold up?",
  low: "Fell apart",
  high: "Held the original",
};

export function RecipeRatingPanel({
  slug,
  signedIn,
  isOwner,
  isPublic,
  summary,
  mine,
}: {
  slug: string;
  signedIn: boolean;
  isOwner: boolean;
  isPublic: boolean;
  summary: RatingSummary;
  mine: RecipeRating | null;
}) {
  const router = useRouter();
  const [taste, setTaste] = useState(mine?.taste ?? 0);
  const [texture, setTexture] = useState(mine?.texture ?? 0);
  const [wouldMakeAgain, setWouldMakeAgain] = useState(mine?.wouldMakeAgain ?? true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (taste < 1 || texture < 1) {
      setMessage("Choose a taste score and a texture score.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/library/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, taste, texture, wouldMakeAgain }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setMessage(payload?.message ?? "We could not save that rating.");
        return;
      }
      setMessage(mine ? "Updated your cook notes." : "Saved. Thank you for cooking it.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white/80 p-5 ring-1 ring-teal/10 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-teal/60 uppercase">Cooked it?</p>
          <h2 className="font-heading mt-1 text-2xl text-teal">Taste and texture</h2>
        </div>
        <CommunityBadge summary={summary} />
      </div>

      {summary.count === 0 ? (
        <p className="text-sm text-teal/75">
          No other kitchens have rated this Thrive Version yet. Community Tested needs{" "}
          {COMMUNITY_TESTED_MIN_RATINGS} cooks at 4 or higher on taste and texture who would make it
          again.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <ScoreStat label="Taste" value={summary.tasteAverage} />
          <ScoreStat label="Texture" value={summary.textureAverage} />
          <ScoreStat
            label="Would make again"
            value={
              summary.wouldMakeAgainRatio == null
                ? null
                : Math.round(summary.wouldMakeAgainRatio * 100)
            }
            suffix="%"
          />
        </div>
      )}
      {summary.count > 0 ? (
        <p className="text-sm text-teal/70">
          {summary.count} {summary.count === 1 ? "cook" : "cooks"}
          {summary.communityTested ? `. ${communityTestedCopy()}` : "."}
        </p>
      ) : null}

      {!isPublic ? (
        <p className="text-sm text-teal/75">Publish this Thrive Version if you want cooks to rate it.</p>
      ) : isOwner ? (
        <p className="text-sm text-teal/75">
          You published this. Community Tested comes from other kitchens after they cook it.
        </p>
      ) : !signedIn ? (
        <p className="text-sm text-teal/75">
          <Link
            className="font-medium underline-offset-4 hover:underline"
            href={`/signin?next=${encodeURIComponent(`/recipes/${slug}`)}`}
          >
            Sign in
          </Link>{" "}
          to rate taste and texture after you cook it.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <ScaleField
            name="taste"
            copy={TASTE_COPY}
            value={taste}
            onChange={setTaste}
          />
          <ScaleField
            name="texture"
            copy={TEXTURE_COPY}
            value={texture}
            onChange={setTexture}
          />
          <fieldset>
            <legend className="text-sm font-medium text-teal">Would you make this again?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <Choice
                selected={wouldMakeAgain}
                onClick={() => setWouldMakeAgain(true)}
                label="Yes"
              />
              <Choice
                selected={!wouldMakeAgain}
                onClick={() => setWouldMakeAgain(false)}
                label="Not this time"
              />
            </div>
          </fieldset>
          <Button
            type="submit"
            disabled={pending}
            className="h-11 bg-teal px-5 text-cream"
          >
            {mine ? "Update rating" : "Save rating"}
          </Button>
          {message ? <p className="text-sm text-teal/75">{message}</p> : null}
        </form>
      )}
    </section>
  );
}

function ScoreStat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl bg-cream/80 px-4 py-3 ring-1 ring-teal/10">
      <p className="text-xs font-semibold tracking-wide text-teal/60 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-medium tabular-nums text-teal">
        {value == null ? "—" : `${value}${suffix}`}
      </p>
    </div>
  );
}

function ScaleField({
  name,
  copy,
  value,
  onChange,
}: {
  name: string;
  copy: { legend: string; low: string; high: string };
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-teal">{copy.legend}</legend>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="w-full text-xs text-teal/65 sm:w-auto">{copy.low}</span>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-pressed={value === score}
            aria-label={`${name} ${score} of 5`}
            onClick={() => onChange(score)}
            className={cn(
              "size-11 rounded-full text-sm font-semibold ring-1 transition",
              value === score
                ? "bg-teal text-cream ring-teal"
                : "bg-white text-teal ring-teal/20 hover:ring-teal/50",
            )}
          >
            {score}
          </button>
        ))}
        <span className="w-full text-xs text-teal/65 sm:w-auto">{copy.high}</span>
      </div>
    </fieldset>
  );
}

function Choice({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium ring-1 transition",
        selected ? "bg-teal text-cream ring-teal" : "bg-white text-teal ring-teal/20 hover:ring-teal/50",
      )}
    >
      {label}
    </button>
  );
}

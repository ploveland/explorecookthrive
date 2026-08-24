"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublishedRecipe } from "@/server/library/schema";

export function VisibilityControl({
  slug,
  visibility,
}: {
  slug: string;
  visibility: PublishedRecipe["visibility"];
}) {
  const router = useRouter();
  const [value, setValue] = useState(visibility);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: PublishedRecipe["visibility"]) {
    setError(null);
    setValue(next);
    const response = await fetch("/api/library/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visibility: next }),
    });
    if (!response.ok) {
      setValue(visibility);
      setError("We could not change who can see this.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className="flex flex-wrap items-center gap-2 text-sm text-teal">
        Visibility
        <select
          className="rounded-lg border border-input bg-white px-2 py-1"
          value={value}
          onChange={(event) => void onChange(event.target.value as PublishedRecipe["visibility"])}
        >
          <option value="public">Public library</option>
          <option value="unlisted">Unlisted link</option>
          <option value="private">Private</option>
        </select>
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

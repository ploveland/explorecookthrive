"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { KitchenCollection } from "@/server/accounts/collections";

export function RecipeSaveBar({
  slug,
  signedIn,
  favorited,
  collections,
}: {
  slug: string;
  signedIn: boolean;
  favorited: boolean;
  collections: KitchenCollection[];
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(favorited);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!signedIn) {
    return (
      <p className="text-sm text-teal/75">
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={`/signin?next=${encodeURIComponent(`/recipes/${slug}`)}`}
        >
          Sign in
        </Link>{" "}
        to favorite this Thrive Version or add it to a collection.
      </p>
    );
  }

  async function onFavorite() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/kitchen/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const payload = (await response.json().catch(() => null)) as { favorited?: boolean } | null;
      if (!response.ok) {
        setMessage("We could not update that favorite.");
        return;
      }
      setSaved(Boolean(payload?.favorited));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onAdd(collectionId: string) {
    setMessage(null);
    const response = await fetch("/api/kitchen/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId, slug }),
    });
    if (!response.ok) {
      setMessage("We could not add that to the collection.");
      return;
    }
    setMessage("Added to the collection.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-teal/10">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => void onFavorite()}
        >
          {saved ? "Favorited" : "Favorite"}
        </Button>
        {collections.length > 0 ? (
          <label className="flex items-center gap-2 text-sm text-teal">
            Add to
            <select
              className="rounded-lg border border-input bg-white px-2 py-1"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) void onAdd(event.target.value);
                event.target.value = "";
              }}
            >
              <option value="">Choose a collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Link className="text-sm font-medium text-teal underline-offset-4 hover:underline" href="/kitchen/collections">
            Make a collection
          </Link>
        )}
      </div>
      {message ? <p className="text-sm text-teal/75">{message}</p> : null}
    </div>
  );
}

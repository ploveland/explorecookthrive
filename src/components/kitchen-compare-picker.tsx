"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compareHref } from "@/lib/compare-href";
import type { ThriveVersionSummary } from "@/server/convert/versions";

export function KitchenComparePicker({ versions }: { versions: ThriveVersionSummary[] }) {
  const [selected, setSelected] = useState<string[]>(() =>
    versions.length === 2 ? versions.map((version) => version.id) : [],
  );

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return [current[1]!, id];
      return [...current, id];
    });
  }

  const href = useMemo(() => {
    if (selected.length !== 2) return null;
    const [first, second] = selected;
    const left = versions.find((version) => version.id === first);
    const right = versions.find((version) => version.id === second);
    if (!left || !right) return null;
    return compareHref(left.id, right.id, left.versionNumber, right.versionNumber);
  }, [selected, versions]);

  if (versions.length < 2) return null;

  return (
    <div className="mt-4 rounded-2xl bg-cream/80 px-4 py-4 ring-1 ring-teal/10">
      <p className="text-sm font-medium text-teal">Compare two Thrive Versions</p>
      <p className="mt-1 text-sm text-teal/70">
        USDA estimates sit side by side. Lower calories is not automatically the better pot.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {versions.map((version) => {
          const pressed = selected.includes(version.id);
          return (
            <button
              key={version.id}
              type="button"
              aria-pressed={pressed}
              onClick={() => toggle(version.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm ring-1 transition",
                pressed
                  ? "bg-teal text-cream ring-teal"
                  : "bg-white text-teal ring-teal/15 hover:bg-white",
              )}
            >
              Version {version.versionNumber}
            </button>
          );
        })}
      </div>
      {href ? (
        <Button render={<Link href={href} />} className="mt-4 h-10 bg-teal px-4 text-cream">
          Compare selected
        </Button>
      ) : (
        <p className="mt-3 text-sm text-teal/65">Choose two versions.</p>
      )}
    </div>
  );
}

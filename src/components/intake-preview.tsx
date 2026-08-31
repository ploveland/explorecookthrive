"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { INTAKE_STORAGE_KEY, parseIntake } from "@/lib/intake";
import { safeHttpUrl } from "@/lib/safe-http-url";
import { Button } from "@/components/ui/button";

function subscribe() {
  return () => {};
}

function readIntake() {
  return parseIntake(sessionStorage.getItem(INTAKE_STORAGE_KEY));
}

export function IntakePreview() {
  const intake = useSyncExternalStore(subscribe, readIntake, () => null);

  if (!intake) {
    return (
      <div className="space-y-4">
        <p>We do not have a recipe waiting yet.</p>
        <Button render={<Link href="/#thrive" />} className="bg-terracotta-strong text-cream">
          Thrive a recipe
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-teal/80">
        Extraction and confirmation come next. For now this is the raw material we
        will read — nothing has been rewritten.
      </p>
      {intake.mode === "url" ? (
        <p>
          <span className="font-medium">Source URL: </span>
          {(() => {
            const href = safeHttpUrl(intake.url);
            return href ? (
              <a className="break-all text-teal underline" href={href} rel="noreferrer noopener">
                {intake.url}
              </a>
            ) : (
              <span className="break-all text-teal/80">{intake.url}</span>
            );
          })()}
        </p>
      ) : (
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-white/80 p-4 text-sm leading-6 text-teal ring-1 ring-teal/10">
          {intake.text}
        </pre>
      )}
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/#thrive" />} variant="outline">
          Edit intake
        </Button>
      </div>
    </div>
  );
}

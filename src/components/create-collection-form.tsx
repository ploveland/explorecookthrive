"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCollectionAction } from "@/app/kitchen/collections/actions";

export function CreateCollectionForm() {
  const [error, formAction, pending] = useActionState(createCollectionAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Input
        name="name"
        required
        minLength={1}
        placeholder="Weeknight pots"
        aria-label="Collection name"
        className="h-11 flex-1 bg-white/80"
      />
      <Button
        type="submit"
        nativeButton
        disabled={pending}
        className="h-11 bg-teal px-5 text-cream"
      >
        {pending ? "Saving…" : "Create collection"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive sm:self-center">
          {error}
        </p>
      ) : null}
    </form>
  );
}

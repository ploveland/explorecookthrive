"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateCollectionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/kitchen/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(payload?.message ?? "We could not create that collection.");
        return;
      }
      setName("");
      router.refresh();
    } catch {
      setError("We could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Weeknight pots"
        aria-label="Collection name"
        className="h-11 flex-1 bg-white/80"
      />
      <Button type="submit" disabled={pending || name.trim().length === 0} className="h-11 bg-teal px-5 text-cream">
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

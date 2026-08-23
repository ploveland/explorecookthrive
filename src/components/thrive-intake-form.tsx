"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ThriveIntakeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload =
      mode === "paste"
        ? { mode: "paste" as const, text: text.trim() }
        : { mode: "url" as const, url: url.trim() };

    if (mode === "paste" && payload.mode === "paste" && payload.text.length < 20) {
      setError("Paste the full recipe — ingredients and steps — so we have something real to work with.");
      return;
    }
    if (mode === "url") {
      try {
        const parsed = new URL(url.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("protocol");
      } catch {
        setError("Enter a full http(s) recipe URL, or paste the recipe instead.");
        return;
      }
    }

    setPending(true);
    try {
      const response = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        draftId?: string;
        message?: string;
        code?: string;
      };
      if (!response.ok || !data.draftId) {
        setError(data.message ?? "We could not read that recipe. Try pasting it instead.");
        return;
      }
      router.push(`/convert/confirm/${data.draftId}`);
    } catch {
      setError("We could not reach the server. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" id="thrive" noValidate>
      <Tabs
        value={mode}
        onValueChange={(value) => {
          setMode(value as "paste" | "url");
          setError(null);
        }}
      >
        <TabsList className="h-11 w-full bg-sage/25">
          <TabsTrigger value="paste" className="flex-1 text-sm">
            Paste a recipe
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1 text-sm">
            Import from a URL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="paste" className="space-y-2 pt-3">
          <Label htmlFor="recipe-text">Recipe text</Label>
          <Textarea
            id="recipe-text"
            name="recipe-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Chicken fried steak&#10;&#10;Ingredients&#10;1 1/2 lb cube steak&#10;1 cup flour&#10;...&#10;&#10;Instructions&#10;Season, dredge, and fry until the crust is gold."
            className="min-h-48 bg-white/80 text-base"
            aria-invalid={Boolean(error) && mode === "paste"}
            aria-describedby={error && mode === "paste" ? "intake-error" : "paste-help"}
          />
          <p id="paste-help" className="text-sm text-muted-foreground">
            Titles, amounts, and method can be messy. You will confirm the reading before anything changes.
          </p>
        </TabsContent>
        <TabsContent value="url" className="space-y-2 pt-3">
          <Label htmlFor="recipe-url">Recipe URL</Label>
          <Input
            id="recipe-url"
            name="recipe-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/your-favorite-lasagna"
            className="h-11 bg-white/80"
            aria-invalid={Boolean(error) && mode === "url"}
            aria-describedby={error && mode === "url" ? "intake-error" : "url-help"}
          />
          <p id="url-help" className="text-sm text-muted-foreground">
            We look for schema.org recipe data first. If a site blocks us, paste the recipe instead.
          </p>
        </TabsContent>
      </Tabs>
      {error ? (
        <div
          id="intake-error"
          role="alert"
          className="rounded-xl bg-terracotta/10 px-3 py-2 text-sm font-medium text-terracotta-strong"
        >
          {error}
        </div>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-terracotta-strong text-base font-semibold text-cream hover:bg-terracotta-strong/90"
      >
        {pending ? "Reading your recipe…" : "Thrive This Recipe"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We do not rewrite a dish just because a “healthier” substitute exists.
      </p>
    </form>
  );
}

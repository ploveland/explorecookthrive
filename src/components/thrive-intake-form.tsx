"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INTAKE_STORAGE_KEY, type RecipeIntake } from "@/lib/intake";

export function ThriveIntakeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "paste") {
      if (text.trim().length < 40) {
        setError("Paste the full recipe — ingredients and steps — so we have something real to work with.");
        return;
      }
    } else {
      try {
        const parsed = new URL(url.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("protocol");
        }
      } catch {
        setError("Enter a full http(s) recipe URL, or paste the recipe instead.");
        return;
      }
    }

    const intake: RecipeIntake = {
      mode,
      text: mode === "paste" ? text.trim() : undefined,
      url: mode === "url" ? url.trim() : undefined,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(intake));
    router.push("/convert/start");
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
            placeholder="Pasta e fagioli&#10;&#10;Ingredients&#10;2 tbsp olive oil&#10;1 onion, chopped&#10;...&#10;&#10;Instructions&#10;Warm the oil and cook the onion until sweet."
            className="min-h-48 bg-white/80 text-base"
            aria-invalid={Boolean(error) && mode === "paste"}
            aria-describedby={error && mode === "paste" ? "intake-error" : "paste-help"}
          />
          <p id="paste-help" className="text-sm text-muted-foreground">
            Titles, amounts, and method can be messy. We will ask you to confirm the reading before anything changes.
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
            We prefer structured recipe data from the page. If a site blocks us, you can paste the recipe instead.
          </p>
        </TabsContent>
      </Tabs>
      {error ? (
        <p id="intake-error" role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-12 w-full bg-terracotta-strong text-base font-semibold text-cream hover:bg-terracotta-strong/90"
      >
        Thrive This Recipe
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We do not rewrite a dish just because a “healthier” substitute exists.
      </p>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SafeHttpLink } from "@/components/safe-http-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExtractedRecipe } from "@/server/recipes/schema";

function toIngredientText(recipe: ExtractedRecipe) {
  return recipe.ingredients.map((item) => item.rawText).join("\n");
}

export function ConfirmRecipeForm({
  draftId,
  initialRecipe,
}: {
  draftId: string;
  initialRecipe: ExtractedRecipe;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialRecipe.title);
  const [description, setDescription] = useState(initialRecipe.description ?? "");
  const [servings, setServings] = useState(initialRecipe.servings?.toString() ?? "");
  const [prepMinutes, setPrepMinutes] = useState(initialRecipe.prepMinutes?.toString() ?? "");
  const [cookMinutes, setCookMinutes] = useState(initialRecipe.cookMinutes?.toString() ?? "");
  const [ingredientText, setIngredientText] = useState(toIngredientText(initialRecipe));
  const [instructionText, setInstructionText] = useState(initialRecipe.instructions.join("\n\n"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const notices = useMemo(
    () => [...initialRecipe.warnings, ...initialRecipe.assumptions],
    [initialRecipe],
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const ingredients = ingredientText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((rawText) => ({
        rawText,
        name: rawText,
        quantity: null,
        unit: null,
        preparation: null,
      }));
    const instructions = instructionText
      .split(/\n\s*\n|\n/)
      .map((line) => line.replace(/^\d+[\.)]\s*/, "").trim())
      .filter(Boolean);

    if (!title.trim()) {
      setError("Give the recipe a name.");
      return;
    }
    if (ingredients.length === 0 || instructions.length === 0) {
      setError("Keep at least one ingredient and one step.");
      return;
    }

    const recipe: ExtractedRecipe = {
      ...initialRecipe,
      title: title.trim(),
      description: description.trim() || null,
      servings: servings ? Number(servings) : null,
      prepMinutes: prepMinutes ? Number(prepMinutes) : null,
      cookMinutes: cookMinutes ? Number(cookMinutes) : null,
      ingredients,
      instructions,
    };

    setPending(true);
    const response = await fetch(`/api/recipes/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe }),
    });
    setPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(payload?.message ?? "We could not save those edits.");
      return;
    }

    router.push(`/convert/goals/${draftId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {notices.length > 0 ? (
        <div className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-teal ring-1 ring-sage/40">
          <p className="font-medium">Please glance at this before we continue</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-teal/80">
          This is how we read it. Fix anything that looks off — especially amounts — then continue.
        </p>
      )}

      {initialRecipe.sourceUrl ? (
        <p className="text-sm text-teal/80">
          Source:{" "}
          <SafeHttpLink className="underline" href={initialRecipe.sourceUrl}>
            {initialRecipe.sourceSite ?? initialRecipe.sourceUrl}
          </SafeHttpLink>
          {initialRecipe.sourceAuthor ? ` · ${initialRecipe.sourceAuthor}` : ""}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            inputMode="numeric"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prep">Prep minutes</Label>
          <Input
            id="prep"
            inputMode="numeric"
            value={prepMinutes}
            onChange={(event) => setPrepMinutes(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cook">Cook minutes</Label>
          <Input
            id="cook"
            inputMode="numeric"
            value={cookMinutes}
            onChange={(event) => setCookMinutes(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          value={ingredientText}
          onChange={(event) => setIngredientText(event.target.value)}
          className="min-h-48 font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">One ingredient per line.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Steps</Label>
        <Textarea
          id="instructions"
          value={instructionText}
          onChange={(event) => setInstructionText(event.target.value)}
          className="min-h-56"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 bg-terracotta-strong px-6 text-cream"
        >
          {pending ? "Saving…" : "Looks right — choose goals"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/#thrive")}>
          Start over
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DIETARY_COPY,
  GOAL_COPY,
  PREFERENCE_COPY,
  dietaryRequirements,
  nutritionGoals,
  tastePreferences,
  type DietaryRequirementId,
  type NutritionGoalId,
  type TastePreferenceId,
} from "@/server/convert/schema";

export function ConvertGoalsForm({
  draftId,
  recipeTitle,
}: {
  draftId: string;
  recipeTitle: string;
}) {
  const router = useRouter();
  const [goals, setGoals] = useState<NutritionGoalId[]>(["healthier_overall"]);
  const [preference, setPreference] = useState<TastePreferenceId>("balanced");
  const [dietary, setDietary] = useState<DietaryRequirementId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleGoal(goal: NutritionGoalId) {
    setGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  }

  function toggleDietary(item: DietaryRequirementId) {
    setDietary((current) =>
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (goals.length === 0) {
      setError("Pick at least one nutrition goal.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, goals, preference, dietary }),
      });
      const payload = (await response.json().catch(() => null)) as {
        jobId?: string;
        message?: string;
        code?: string;
      } | null;
      if (!response.ok || !payload?.jobId) {
        if (response.status === 403 && payload?.code === "sign_in_required") {
          router.push(`/signin?reason=limit&next=${encodeURIComponent(`/convert/goals/${draftId}`)}`);
          return;
        }
        setError(payload?.message ?? "We could not start that conversion.");
        return;
      }
      router.push(`/convert/working/${payload.jobId}`);
    } catch {
      setError("We could not reach the server. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-2xl text-teal">What should we aim for?</h2>
          <p className="mt-1 text-sm text-teal/75">
            Choose one or more. We will not flatten {recipeTitle} to chase a number.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {nutritionGoals.map((goal) => {
            const selected = goals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleGoal(goal)}
                className={cn(
                  "rounded-2xl px-4 py-3 text-left ring-1 transition",
                  selected
                    ? "bg-terracotta/10 ring-terracotta"
                    : "bg-white/80 ring-teal/10 hover:ring-teal/30",
                )}
              >
                <p className="font-medium text-teal">{GOAL_COPY[goal].label}</p>
                <p className="mt-1 text-sm text-teal/75">{GOAL_COPY[goal].detail}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl text-teal">How close should it stay?</h2>
        <div className="grid gap-3">
          {tastePreferences.map((option) => {
            const selected = preference === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setPreference(option)}
                className={cn(
                  "rounded-2xl px-4 py-3 text-left ring-1 transition",
                  selected
                    ? "bg-sage/20 ring-sage"
                    : "bg-white/80 ring-teal/10 hover:ring-teal/30",
                )}
              >
                <p className="font-medium text-teal">{PREFERENCE_COPY[option].label}</p>
                <p className="mt-1 text-sm text-teal/75">{PREFERENCE_COPY[option].detail}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-2xl text-teal">Dietary needs</h2>
          <p className="mt-1 text-sm text-teal/75">
            Optional. If a constraint would turn this into a different dish, we will say so
            instead of faking it.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {dietaryRequirements.map((item) => {
            const selected = dietary.includes(item);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleDietary(item)}
                className={cn(
                  "rounded-2xl px-4 py-3 text-left ring-1 transition",
                  selected
                    ? "bg-sage/20 ring-sage"
                    : "bg-white/80 ring-teal/10 hover:ring-teal/30",
                )}
              >
                <p className="font-medium text-teal">{DIETARY_COPY[item].label}</p>
                <p className="mt-1 text-sm text-teal/75">{DIETARY_COPY[item].detail}</p>
              </button>
            );
          })}
        </div>
      </section>

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
          {pending ? "Starting…" : "Thrive this recipe"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/convert/confirm/${draftId}`)}
        >
          Edit the recipe
        </Button>
      </div>
    </form>
  );
}

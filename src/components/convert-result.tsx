import Link from "next/link";
import type { ConversionOutput } from "@/server/ai/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConvertNutrition } from "@/components/convert-nutrition";
import { PublishThriveForm } from "@/components/publish-thrive-form";
import {
  DIETARY_COPY,
  GOAL_COPY,
  PREFERENCE_COPY,
  type ConversionJob,
} from "@/server/convert/schema";
import type { ExtractedRecipe } from "@/server/recipes/schema";

function IngredientList({
  items,
}: {
  items: { rawText: string; name: string; assumptionNote?: string | null }[];
}) {
  return (
    <ul className="space-y-2 text-sm text-teal">
      {items.map((item) => (
        <li key={item.rawText}>
          <span>{item.rawText}</span>
          {item.assumptionNote ? (
            <span className="mt-0.5 block text-xs text-teal/65">{item.assumptionNote}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ConvertResult({
  job,
  publishedSlug,
  signedIn = false,
}: {
  job: ConversionJob & { output: ConversionOutput; recipe: ExtractedRecipe };
  publishedSlug?: string | null;
  signedIn?: boolean;
}) {
  const output = job.output;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={publishedSlug ? "outline" : "secondary"}>
          {publishedSlug ? "Published" : "Private"}
        </Badge>
        <Badge variant="outline">{PREFERENCE_COPY[job.preference].label}</Badge>
        {job.goals.map((goal) => (
          <Badge key={goal} variant="outline">
            {GOAL_COPY[goal].label}
          </Badge>
        ))}
        {job.dietary.map((item) => (
          <Badge key={item} variant="outline">
            {DIETARY_COPY[item].label}
          </Badge>
        ))}
      </div>

      {job.provider === "mock" ? (
        <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-teal ring-1 ring-sage/40">
          This Thrive Version was written by the local culinary mock because no OpenAI key is
          set. Nutrition numbers below still come from USDA values, not from the mock.
        </p>
      ) : (
        <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-teal ring-1 ring-sage/40">
          The rewrite does not invent calories. Macros are estimated from USDA FoodData Central
          after the Thrive Version is written.
        </p>
      )}

      {job.nutrition ? <ConvertNutrition nutrition={job.nutrition} /> : null}

      <section className="space-y-3">
        <h2 className="font-heading text-2xl text-teal">What we would not change</h2>
        <ul className="space-y-3">
          {output.analysis.wouldNotChange.map((entry) => (
            <li key={entry.item} className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-teal/10">
              <p className="font-medium text-teal">{entry.item}</p>
              <p className="mt-1 text-sm text-teal/75">{entry.reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl text-teal">What changed, and why</h2>
        <ul className="space-y-3">
          {output.changes.map((change) => (
            <li key={`${change.original}-${change.suggested}`} className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-teal/10">
              <p className="text-sm font-medium text-teal">
                {change.original} → {change.suggested}
              </p>
              <p className="mt-2 text-sm text-teal/80">{change.nutritionReason}</p>
              <p className="mt-1 text-sm text-teal/70">Flavor: {change.flavorEffect}</p>
              <p className="text-sm text-teal/70">Texture: {change.textureEffect}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/80 p-5 ring-1 ring-teal/10">
          <p className="text-xs font-semibold tracking-[0.16em] text-teal/60 uppercase">Original</p>
          <h3 className="font-heading mt-2 text-2xl text-teal">{job.recipe.title}</h3>
          <IngredientList items={job.recipe.ingredients.map((item) => ({ ...item, name: item.name ?? item.rawText }))} />
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-teal/80">
            {job.recipe.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl bg-white p-5 ring-1 ring-terracotta/30">
          <p className="text-xs font-semibold tracking-[0.16em] text-terracotta uppercase">
            Thrive Version
          </p>
          <h3 className="font-heading mt-2 text-2xl text-teal">{output.thriveVersion.title}</h3>
          <p className="mt-1 text-sm text-teal/75">{output.thriveVersion.description}</p>
          <IngredientList items={output.thriveVersion.ingredients} />
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-teal/80">
            {output.thriveVersion.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      {output.analysis.assumptions.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-heading text-2xl text-teal">Assumptions</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-teal/80">
            {output.analysis.assumptions.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <PublishThriveForm
        jobId={job.id}
        publishedSlug={publishedSlug ?? null}
        signedIn={signedIn}
      />

      <p className="text-sm text-teal/70">
        Taste impact: {output.analysis.tasteImpact}.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href={`/convert/goals/${job.draftId}`} />} variant="outline">
          Try different goals
        </Button>
        <Button render={<Link href="/#thrive" />} className="bg-terracotta-strong text-cream">
          Thrive another recipe
        </Button>
      </div>
    </div>
  );
}

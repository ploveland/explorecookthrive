import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConvertNutrition } from "@/components/convert-nutrition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIETARY_COPY, GOAL_COPY, PREFERENCE_COPY } from "@/server/convert/schema";
import { getPublishedBySlug } from "@/server/library/store";
import { TAXONOMY_TAGS } from "@/server/taxonomy/tags";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getPublishedBySlug(slug);
  if (!recipe) return { title: "Recipe" };
  return {
    title: recipe.title,
    description: recipe.description,
  };
}

export default async function PublishedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getPublishedBySlug(slug);
  if (!recipe) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        Thrive Version
      </p>
      <div className="space-y-3">
        <h1 className="font-heading text-4xl text-teal">{recipe.title}</h1>
        <p className="max-w-3xl text-lg leading-8 text-teal/80">{recipe.description}</p>
        <p className="text-sm text-teal/70">
          Based on {recipe.originalTitle}
          {recipe.sourceAuthor ? ` by ${recipe.sourceAuthor}` : ""}
          {recipe.sourceSite ? ` · ${recipe.sourceSite}` : ""}.
          {recipe.sourceUrl ? (
            <>
              {" "}
              <a className="underline-offset-4 hover:underline" href={recipe.sourceUrl} rel="noreferrer">
                Original source
              </a>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Published</Badge>
        <Badge variant="outline">{PREFERENCE_COPY[recipe.preference].label}</Badge>
        {recipe.goals.map((goal) => (
          <Badge key={goal} variant="outline">
            {GOAL_COPY[goal].label}
          </Badge>
        ))}
        {recipe.dietary.map((item) => (
          <Badge key={item} variant="outline">
            {DIETARY_COPY[item].label}
          </Badge>
        ))}
        {recipe.tags.slice(0, 4).map((tag) => (
          <Link key={tag} href={`/recipes?tag=${tag}`}>
            <Badge variant="outline">{TAXONOMY_TAGS.find((item) => item.slug === tag)?.name ?? tag}</Badge>
          </Link>
        ))}
      </div>

      {recipe.nutrition ? <ConvertNutrition nutrition={recipe.nutrition} /> : null}

      <section className="space-y-3">
        <h2 className="font-heading text-2xl text-teal">What we would not change</h2>
        <ul className="space-y-3">
          {recipe.wouldNotChange.map((entry) => (
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
          {recipe.changes.map((change) => (
            <li
              key={`${change.original}-${change.suggested}`}
              className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-teal/10"
            >
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

      <section className="rounded-3xl bg-white p-5 ring-1 ring-terracotta/30">
        <p className="text-xs font-semibold tracking-[0.16em] text-terracotta uppercase">
          Thrive Version
        </p>
        <p className="mt-2 text-sm text-teal/70">
          {recipe.servings} servings
          {recipe.prepMinutes ? ` · ${recipe.prepMinutes} min prep` : ""}
          {recipe.cookMinutes ? ` · ${recipe.cookMinutes} min cook` : ""}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-teal">
          {recipe.ingredients.map((item) => (
            <li key={item.rawText}>
              {item.rawText}
              {item.assumptionNote ? (
                <span className="mt-0.5 block text-xs text-teal/65">{item.assumptionNote}</span>
              ) : null}
            </li>
          ))}
        </ul>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-teal/80">
          {recipe.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <p className="text-sm text-teal/70">Taste impact: {recipe.tasteImpact}.</p>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/recipes" />} variant="outline">
          Back to the library
        </Button>
        <Button render={<Link href="/#thrive" />} className="bg-terracotta-strong text-cream">
          Thrive a recipe
        </Button>
      </div>
    </div>
  );
}

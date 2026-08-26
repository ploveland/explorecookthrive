import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CommunityBadge } from "@/components/community-badge";
import { RecipeCover } from "@/components/recipe-cover";
import { coverInputFromPublished } from "@/lib/recipe-cover";
import { GOAL_COPY } from "@/server/convert/schema";
import type { RatingSummary } from "@/server/community/policy";
import type { PublishedRecipe } from "@/server/library/schema";
import { nutritionCardHighlight } from "@/server/nutrition/highlight";
import { TAXONOMY_TAGS } from "@/server/taxonomy/tags";

function tagLabel(slug: string) {
  return TAXONOMY_TAGS.find((tag) => tag.slug === slug)?.name ?? slug;
}

export function RecipeCard({
  recipe,
  community,
}: {
  recipe: PublishedRecipe;
  community?: RatingSummary;
}) {
  const shown = recipe.tags.slice(0, 3);
  const highlight = nutritionCardHighlight(recipe.nutrition);
  const primaryGoal = recipe.goals[0] ? GOAL_COPY[recipe.goals[0]].label : null;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-teal/10 bg-white/70 shadow-[0_10px_30px_-24px_rgba(61,90,128,0.6)] transition hover:border-terracotta/40 hover:bg-white"
    >
      <div className="overflow-hidden">
        <div className="origin-center transition duration-300 group-hover:scale-[1.03]">
          <RecipeCover seed={coverInputFromPublished(recipe)} size="card" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {community?.communityTested ? (
          <div className="mb-2">
            <CommunityBadge summary={community} />
          </div>
        ) : null}
        <h3 className="font-heading text-xl text-teal group-hover:text-terracotta-strong">
          {recipe.title}
        </h3>
        <p className="mt-1 text-xs text-teal/60">Based on {recipe.originalTitle}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-teal/80">{recipe.description}</p>
        {highlight ? (
          <p className="mt-2 text-sm text-teal">
            {highlight.calories}
            {highlight.improvement ? (
              <span className="mt-0.5 block text-xs text-teal/70">{highlight.improvement}</span>
            ) : null}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-teal/65">
          {primaryGoal ? `${primaryGoal} · ` : null}
          Taste impact: {recipe.tasteImpact}
        </p>
        {community && community.count > 0 ? (
          <p className="mt-2 text-sm text-teal/70">
            {community.overallAverage ?? "—"} / 5 from {community.count}{" "}
            {community.count === 1 ? "cook" : "cooks"}
          </p>
        ) : null}
        {shown.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {shown.map((tag) => (
              <Badge key={tag} variant="outline">
                {tagLabel(tag)}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

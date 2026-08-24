import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PublishedRecipe } from "@/server/library/schema";
import { TAXONOMY_TAGS } from "@/server/taxonomy/tags";

function tagLabel(slug: string) {
  return TAXONOMY_TAGS.find((tag) => tag.slug === slug)?.name ?? slug;
}

export function RecipeCard({ recipe }: { recipe: PublishedRecipe }) {
  const shown = recipe.tags.slice(0, 3);

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex flex-col rounded-2xl border border-teal/10 bg-white/70 p-5 shadow-[0_10px_30px_-24px_rgba(61,90,128,0.6)] transition hover:border-terracotta/40 hover:bg-white"
    >
      <div
        aria-hidden
        className="mb-4 h-28 rounded-xl bg-[linear-gradient(135deg,#8DA78A_0%,#3D5A80_55%,#E07A5F_120%)] opacity-90"
      />
      <h3 className="font-heading text-xl text-teal group-hover:text-terracotta-strong">
        {recipe.title}
      </h3>
      <p className="mt-1 text-xs text-teal/60">Based on {recipe.originalTitle}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-teal/80">{recipe.description}</p>
      {shown.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {shown.map((tag) => (
            <Badge key={tag} variant="outline">
              {tagLabel(tag)}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

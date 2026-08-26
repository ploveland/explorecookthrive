import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConvertNutrition } from "@/components/convert-nutrition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIETARY_COPY, GOAL_COPY, PREFERENCE_COPY } from "@/server/convert/schema";
import { CommunityBadge } from "@/components/community-badge";
import { JumpToRecipe } from "@/components/jump-to-recipe";
import { RecipeRatingPanel } from "@/components/recipe-rating";
import { RecipeSaveBar } from "@/components/recipe-save-bar";
import { RecipeShare } from "@/components/recipe-share";
import { ScaledRecipe } from "@/components/scaled-recipe";
import { VisibilityControl } from "@/components/visibility-control";
import { listCollections } from "@/server/accounts/collections";
import { isFavorite } from "@/server/accounts/favorites";
import { currentAccount } from "@/server/accounts/session";
import { getRatingSummary, getUserRating, listPublicReviews } from "@/server/community/store";
import { recipeIsShareable, recipeShareUrl } from "@/server/library/share";
import { getVisibleBySlug } from "@/server/library/store";
import { recipeJsonLd, shouldIndexRecipe } from "@/server/seo/jsonld";
import { siteUrl } from "@/server/seo/site";
import { TAXONOMY_TAGS } from "@/server/taxonomy/tags";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getVisibleBySlug(slug, null);
  if (!recipe) {
    return { title: "Recipe", robots: { index: false, follow: false } };
  }
  const index = shouldIndexRecipe(recipe);
  const url = `${siteUrl()}/recipes/${recipe.slug}`;
  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      url,
      type: "article",
    },
  };
}

export default async function PublishedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const account = await currentAccount();
  const recipe = await getVisibleBySlug(slug, account.userId);
  if (!recipe) notFound();
  const favorited = account.userId ? await isFavorite(account.userId, recipe.slug) : false;
  const collections = account.userId ? await listCollections(account.userId) : [];
  const isOwner = Boolean(account.userId && recipe.ownerId === account.userId);
  const community = await getRatingSummary(recipe.slug);
  const mine = account.userId ? await getUserRating(recipe.slug, account.userId) : null;
  const reviews = await listPublicReviews(recipe.slug);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      {recipe.visibility === "public" ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd(recipe, community)) }}
        />
      ) : null}
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        Thrive Version
      </p>
      <div className="space-y-3">
        <h1 className="font-heading text-4xl text-teal">{recipe.title}</h1>
        <p className="max-w-3xl text-lg leading-8 text-teal/80">{recipe.description}</p>
        <JumpToRecipe />
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
        <CommunityBadge summary={community} />
        <Badge variant="secondary">
          {recipe.visibility === "public" ? "Published" : recipe.visibility === "unlisted" ? "Unlisted" : "Private"}
        </Badge>
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

      {recipe.ownerName ? (
        <p className="text-sm text-teal/70">Published by {recipe.ownerName}.</p>
      ) : null}

      {isOwner ? <VisibilityControl slug={recipe.slug} visibility={recipe.visibility} /> : null}

      <RecipeSaveBar
        slug={recipe.slug}
        signedIn={Boolean(account.userId)}
        favorited={favorited}
        collections={collections}
      />

      {recipeIsShareable(recipe.visibility) ? (
        <RecipeShare
          title={recipe.title}
          url={recipeShareUrl(recipe.slug)}
          visibility={recipe.visibility}
        />
      ) : null}

      <RecipeRatingPanel
        slug={recipe.slug}
        signedIn={Boolean(account.userId)}
        isOwner={isOwner}
        isPublic={recipe.visibility === "public"}
        summary={community}
        mine={mine}
        reviews={reviews}
      />

      <JumpToRecipe />

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

      <section id="recipe" className="scroll-mt-28 rounded-3xl bg-white p-5 ring-1 ring-terracotta/30">
        <p className="text-xs font-semibold tracking-[0.16em] text-terracotta uppercase">
          Thrive Version
        </p>
        <div className="mt-3">
          <ScaledRecipe
            servings={recipe.servings}
            prepMinutes={recipe.prepMinutes}
            cookMinutes={recipe.cookMinutes}
            ingredients={recipe.ingredients}
            instructions={recipe.instructions}
          />
        </div>
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

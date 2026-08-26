import { siteUrl } from "../seo/site";
import type { PublishedRecipe } from "./schema";

export function recipeIsShareable(visibility: PublishedRecipe["visibility"]) {
  return visibility === "public" || visibility === "unlisted";
}

export function recipeShareUrl(slug: string) {
  const safe = slug.trim().replace(/^\/+|\/+$/g, "");
  return `${siteUrl()}/recipes/${safe}`;
}

export function recipeShareCopy(input: { title: string; url: string }) {
  const title = input.title.trim() || "Thrive Version";
  return {
    title,
    text: `${title} — a Thrive Version from Explore Cook Thrive. Keep the flavor. Improve the recipe.`,
    url: input.url,
  };
}

export function recipeShareMailto(input: { title: string; url: string }) {
  const payload = recipeShareCopy(input);
  const subject = encodeURIComponent(payload.title);
  const body = encodeURIComponent(`${payload.text}\n${payload.url}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

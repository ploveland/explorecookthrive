import type { MetadataRoute } from "next";
import type { PublishedRecipe } from "../library/schema";

export function staticSitemapEntries(base: string): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/recipes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

export function recipeSitemapEntries(
  base: string,
  recipes: Array<Pick<PublishedRecipe, "slug" | "visibility" | "publishedAt">>,
): MetadataRoute.Sitemap {
  return recipes
    .filter((recipe) => recipe.visibility === "public")
    .map((recipe) => ({
      url: `${base}/recipes/${recipe.slug}`,
      lastModified: recipe.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
}

import type { MetadataRoute } from "next";
import { listPublished } from "@/server/library/store";
import { siteUrl } from "@/server/seo/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const recipes = await listPublished();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/recipes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.5 },
    ...recipes.map((recipe) => ({
      url: `${base}/recipes/${recipe.slug}`,
      lastModified: recipe.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

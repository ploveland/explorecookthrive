import type { MetadataRoute } from "next";
import { listPublished } from "@/server/library/store";
import { recipeSitemapEntries, staticSitemapEntries } from "@/server/seo/sitemap";
import { siteUrl } from "@/server/seo/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const recipes = await listPublished();
  return [...staticSitemapEntries(base), ...recipeSitemapEntries(base, recipes)];
}

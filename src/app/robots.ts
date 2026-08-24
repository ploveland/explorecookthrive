import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/convert/", "/kitchen/", "/api/", "/signin", "/signup"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

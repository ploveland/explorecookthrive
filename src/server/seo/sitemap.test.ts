import { describe, expect, it } from "vitest";
import { recipeSitemapEntries, staticSitemapEntries } from "./sitemap";

describe("sitemap helpers", () => {
  it("includes public library surfaces and not conversion routes", () => {
    const urls = staticSitemapEntries("https://explorecookthrive.com").map((entry) => entry.url);
    expect(urls).toEqual([
      "https://explorecookthrive.com",
      "https://explorecookthrive.com/recipes",
      "https://explorecookthrive.com/search",
      "https://explorecookthrive.com/contact",
    ]);
    expect(urls.join(" ")).not.toMatch(/convert|kitchen|signin/);
  });

  it("includes only public recipe URLs", () => {
    const entries = recipeSitemapEntries("https://explorecookthrive.com", [
      { slug: "chili-public", visibility: "public", publishedAt: "2026-08-26T00:00:00.000Z" },
      { slug: "chili-unlisted", visibility: "unlisted", publishedAt: "2026-08-26T00:00:00.000Z" },
      { slug: "chili-private", visibility: "private", publishedAt: "2026-08-26T00:00:00.000Z" },
    ]);
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://explorecookthrive.com/recipes/chili-public",
    ]);
  });
});

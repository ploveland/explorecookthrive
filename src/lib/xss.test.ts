import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld-script";
import { recipeJsonLd } from "@/server/seo/jsonld";
import type { PublishedRecipe } from "@/server/library/schema";
import { extractedRecipeSchema } from "@/server/recipes/schema";

const recipe = {
  slug: "weeknight-chili-thrived",
  title: "Weeknight chili, thrived",
  description: "A pot that still tastes like chili.",
  originalTitle: "Weeknight chili",
  sourceUrl: "https://example.com/chili",
  sourceAuthor: "Pat",
  servings: 6,
  prepMinutes: 15,
  cookMinutes: 40,
  cuisine: "American",
  category: "dinner",
  tags: [],
  dietary: [],
  ownerName: "Sam Kitchen",
  publishedAt: "2026-08-26T20:15:45.000Z",
  visibility: "public",
  ingredients: [{ rawText: "1 pound ground beef" }],
  instructions: ["Brown the beef."],
  nutrition: null,
  image: null,
} as unknown as PublishedRecipe;

describe("JSON-LD script encoding", () => {
  it("encodes characters that can break out of a script tag", () => {
    const html = serializeJsonLd({
      name: "</script><script>alert(1)</script>",
      note: "line\u2028break & more > less",
    });
    expect(html).not.toContain("</script>");
    expect(html).not.toContain("<");
    expect(html).not.toContain(">");
    expect(html).not.toContain("&");
    expect(html).toContain("\\u003c/script\\u003e");
    expect(html).toContain("\\u2028");
    expect(html).toContain("\\u0026");
  });

  it("keeps a malicious recipe title as data, not HTML", () => {
    const json = recipeJsonLd({
      ...recipe,
      title: '</script><script>alert("xss")</script>',
      description: '<img src=x onerror=alert(1)>',
      ingredients: [{ rawText: '<script>alert(1)</script>' }],
      instructions: ["</script><svg onload=alert(1)>"],
    });
    const html = serializeJsonLd(json);
    expect(html).not.toMatch(/<\/script>/i);
    expect(JSON.parse(html).name).toContain("alert");
  });

  it("omits javascript and data source URLs from JSON-LD", () => {
    const json = recipeJsonLd({
      ...recipe,
      sourceUrl: "javascript:alert(document.cookie)",
    });
    expect(json.isBasedOn).toMatchObject({ "@type": "CreativeWork" });
    expect(json.isBasedOn).not.toHaveProperty("url");
  });
});

describe("stored recipe URLs", () => {
  it("drops unsafe source URLs when a draft is saved", () => {
    const parsed = extractedRecipeSchema.parse({
      title: "Chili",
      description: null,
      servings: 4,
      prepMinutes: null,
      cookMinutes: null,
      cuisine: null,
      category: null,
      ingredients: [
        { rawText: "1 onion", name: "onion", quantity: 1, unit: null, preparation: null },
      ],
      instructions: ["Simmer."],
      sourceUrl: "javascript:alert(1)",
      sourceSite: "evil.example",
      sourceAuthor: null,
      originalTitle: "Chili",
      extractor: "paste",
      confidence: "high",
      warnings: [],
      assumptions: [],
    });
    expect(parsed.sourceUrl).toBeNull();
  });
});

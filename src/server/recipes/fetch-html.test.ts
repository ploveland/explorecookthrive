import { describe, expect, it } from "vitest";
import { fetchRecipeHtml, MAX_HTML_BYTES } from "./fetch-html";
import type { SafeHttpTarget } from "./ssrf";

const PUBLIC = "93.184.216.34";

function publicLookup() {
  return async () => [{ address: PUBLIC, family: 4 as const }];
}

describe("fetchRecipeHtml", () => {
  it("connects to the IP that was validated, not a later DNS answer", async () => {
    let lookups = 0;
    const pins: string[] = [];
    const html = await fetchRecipeHtml("https://rebinder.example/recipe", {
      lookup: async () => {
        lookups += 1;
        return [{ address: lookups === 1 ? PUBLIC : "127.0.0.1", family: 4 }];
      },
      request: async (target) => {
        pins.push(target.pin.address);
        return new Response("<html><body>chili</body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      },
    });
    expect(html.html).toContain("chili");
    expect(pins).toEqual([PUBLIC]);
    expect(lookups).toBe(1);
  });

  it("re-validates redirects and refuses an internal Location", async () => {
    await expect(
      fetchRecipeHtml("https://public.example/recipe", {
        lookup: publicLookup(),
        request: async (target: SafeHttpTarget) => {
          if (target.hostname === "public.example") {
            return new Response(null, {
              status: 302,
              headers: { location: "http://127.0.0.1/secret" },
            });
          }
          return new Response("should not fetch", { status: 200 });
        },
      }),
    ).rejects.toMatchObject({ code: "blocked_url" });
  });

  it("refuses a redirect to a hostname that resolves privately", async () => {
    await expect(
      fetchRecipeHtml("https://public.example/recipe", {
        lookup: async (hostname) => {
          if (hostname === "public.example") return [{ address: PUBLIC, family: 4 }];
          return [{ address: "169.254.169.254", family: 4 }];
        },
        request: async () =>
          new Response(null, {
            status: 302,
            headers: { location: "https://metadata.example/latest/meta-data" },
          }),
      }),
    ).rejects.toMatchObject({ code: "blocked_url" });
  });

  it("stops reading once the body exceeds the size limit", async () => {
    const oversized = "x".repeat(MAX_HTML_BYTES + 20);
    await expect(
      fetchRecipeHtml("https://public.example/recipe", {
        lookup: publicLookup(),
        request: async () =>
          new Response(oversized, {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
      }),
    ).rejects.toMatchObject({ code: "fetch_failed" });
  });

  it("refuses too many redirects", async () => {
    await expect(
      fetchRecipeHtml("https://public.example/recipe", {
        lookup: publicLookup(),
        request: async () =>
          new Response(null, {
            status: 302,
            headers: { location: "/again" },
          }),
      }),
    ).rejects.toMatchObject({ code: "fetch_failed" });
  });
});

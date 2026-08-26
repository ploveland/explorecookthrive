import { afterEach, describe, expect, it } from "vitest";
import { recipeIsShareable, recipeShareCopy, recipeShareMailto, recipeShareUrl } from "./share";

describe("public recipe share", () => {
  afterEach(() => {
    delete process.env.APP_URL;
    delete process.env.AUTH_URL;
    delete process.env.RENDER_EXTERNAL_URL;
  });

  it("allows public and unlisted links, not private kitchens", () => {
    expect(recipeIsShareable("public")).toBe(true);
    expect(recipeIsShareable("unlisted")).toBe(true);
    expect(recipeIsShareable("private")).toBe(false);
  });

  it("builds the canonical recipe URL", () => {
    process.env.APP_URL = "https://explorecookthrive.com/";
    expect(recipeShareUrl("weeknight-chili-thrived")).toBe(
      "https://explorecookthrive.com/recipes/weeknight-chili-thrived",
    );
  });

  it("shares title and URL without recipe ingredients or steps", () => {
    const payload = recipeShareCopy({
      title: "Weeknight chili, thrived",
      url: "https://explorecookthrive.com/recipes/weeknight-chili-thrived",
    });
    expect(payload.title).toBe("Weeknight chili, thrived");
    expect(payload.url).toBe("https://explorecookthrive.com/recipes/weeknight-chili-thrived");
    expect(payload.text).toMatch(/Thrive Version/);
    expect(payload.text).not.toMatch(/ground beef|Brown the|cup /i);
  });

  it("builds an email that carries the public link", () => {
    const href = recipeShareMailto({
      title: "Weeknight chili, thrived",
      url: "https://explorecookthrive.com/recipes/weeknight-chili-thrived",
    });
    expect(href.startsWith("mailto:?")).toBe(true);
    expect(href).toContain(encodeURIComponent("Weeknight chili, thrived"));
    expect(href).toContain(encodeURIComponent("https://explorecookthrive.com/recipes/weeknight-chili-thrived"));
    expect(decodeURIComponent(href)).not.toMatch(/1 pound ground beef/i);
  });
});

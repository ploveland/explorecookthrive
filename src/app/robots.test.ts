import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("allows the public library and blocks private conversion routes", () => {
    const doc = robots();
    expect(doc.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: ["/convert/", "/kitchen/", "/api/", "/signin", "/signup"],
    });
    expect(doc.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

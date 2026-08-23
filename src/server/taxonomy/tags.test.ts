import { describe, expect, it } from "vitest";
import { TAXONOMY_TAGS, TAG_TYPES } from "./tags";

describe("taxonomy", () => {
  it("covers every tag type from the spec", () => {
    const types = new Set(TAXONOMY_TAGS.map((tag) => tag.type));
    expect([...types].sort()).toEqual([...TAG_TYPES].sort());
  });

  it("uses unique slugs", () => {
    const slugs = TAXONOMY_TAGS.map((tag) => tag.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("includes core meals, dietary needs, and southern cuisine", () => {
    const slugs = TAXONOMY_TAGS.map((tag) => tag.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "breakfast",
        "dinner",
        "southern",
        "vegetarian",
        "gluten-free",
        "weeknight",
        "higher-protein",
      ]),
    );
  });
});

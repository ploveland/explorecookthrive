import { describe, expect, it } from "vitest";
import { isRecipeFoodPhoto } from "./image";

describe("isRecipeFoodPhoto", () => {
  it("accepts original, user, and licensed photos", () => {
    expect(
      isRecipeFoodPhoto({
        url: "https://cdn.example.com/dish.jpg",
        alt: "Chili",
        width: 1200,
        height: 800,
        source: "user_upload",
        credit: null,
      }),
    ).toBe(true);
  });

  it("rejects generated artwork and missing urls", () => {
    expect(
      isRecipeFoodPhoto({
        url: "https://cdn.example.com/cover.png",
        alt: "Gradient",
        width: 800,
        height: 400,
        source: "generated",
        credit: null,
      }),
    ).toBe(false);
    expect(isRecipeFoodPhoto(null)).toBe(false);
  });
});

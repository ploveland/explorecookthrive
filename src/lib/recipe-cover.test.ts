import { describe, expect, it } from "vitest";
import { pickCoverPalette, planRecipeCover } from "./recipe-cover";

describe("recipe cover palettes", () => {
  it("picks bake for desserts and biscuits", () => {
    expect(pickCoverPalette({ key: "biscuits-1", title: "Buttermilk biscuits, thrived" })).toBe(
      "bake",
    );
    expect(
      pickCoverPalette({
        key: "cake-1",
        title: "Sheet cake",
        tags: ["dessert"],
      }),
    ).toBe("bake");
  });

  it("picks spice, garden, and hearth from cuisine and dish", () => {
    expect(
      pickCoverPalette({ key: "tacos-1", title: "Weeknight tacos", cuisine: "Mexican" }),
    ).toBe("spice");
    expect(
      pickCoverPalette({
        key: "salad-1",
        title: "Lentil salad",
        tags: ["vegetarian", "mediterranean"],
      }),
    ).toBe("garden");
    expect(pickCoverPalette({ key: "chili-1", title: "Weeknight chili, thrived" })).toBe("hearth");
  });

  it("is stable for the same recipe and varies the angle across recipes", () => {
    const chili = planRecipeCover({
      key: "weeknight-chili-abcd1234",
      title: "Weeknight chili, thrived",
    });
    const again = planRecipeCover({
      key: "weeknight-chili-abcd1234",
      title: "Weeknight chili, thrived",
    });
    const biscuits = planRecipeCover({
      key: "buttermilk-biscuits-efgh5678",
      title: "Buttermilk biscuits, thrived",
    });
    expect(chili).toEqual(again);
    expect(chili.backgroundImage).toContain("linear-gradient");
    expect(biscuits.paletteId).not.toBe(chili.paletteId);
    expect(biscuits.angle).not.toBe(chili.angle);
  });
});

import { describe, expect, it } from "vitest";
import { kitchenOwns, canViewPublishedRecipe, ownedOrNull } from "./kitchen-access";

const userA = { userId: "user-a", guestId: "guest-a" };
const userB = { userId: "user-b", guestId: "guest-b" };

describe("kitchenOwns", () => {
  it("matches signed-in owner and ignores a leftover guest cookie", () => {
    const resource = { userId: "user-a", guestId: "guest-a" };
    expect(kitchenOwns(resource, userA)).toBe(true);
    expect(kitchenOwns(resource, { userId: "user-b", guestId: "guest-a" })).toBe(false);
    expect(kitchenOwns(resource, { userId: null, guestId: "guest-a" })).toBe(false);
  });

  it("matches guest owner only before the record is claimed", () => {
    const resource = { userId: null, guestId: "guest-a" };
    expect(kitchenOwns(resource, { userId: null, guestId: "guest-a" })).toBe(true);
    expect(kitchenOwns(resource, { userId: null, guestId: "guest-b" })).toBe(false);
    expect(kitchenOwns(resource, { userId: "user-a", guestId: null })).toBe(false);
  });

  it("denies records with no owner", () => {
    expect(kitchenOwns({ userId: null, guestId: null }, userA)).toBe(false);
    expect(ownedOrNull({ userId: "user-a", guestId: null }, userB)).toBeNull();
  });
});

describe("canViewPublishedRecipe", () => {
  it("lets anyone view public and unlisted recipes, and only the owner view private ones", () => {
    expect(canViewPublishedRecipe({ visibility: "public", ownerId: "user-a" }, null)).toBe(true);
    expect(canViewPublishedRecipe({ visibility: "unlisted", ownerId: "user-a" }, "user-b")).toBe(true);
    expect(canViewPublishedRecipe({ visibility: "private", ownerId: "user-a" }, "user-a")).toBe(true);
    expect(canViewPublishedRecipe({ visibility: "private", ownerId: "user-a" }, "user-b")).toBe(false);
    expect(canViewPublishedRecipe({ visibility: "private", ownerId: "user-a" }, null)).toBe(false);
  });
});

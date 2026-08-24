import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { createCollection, addToCollection, listCollections } from "./collections";
import { listFavoriteSlugs, toggleFavorite } from "./favorites";
import { createUser, verifyUser, AccountError } from "./users";

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "users"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "favorites"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "collections"), { recursive: true, force: true });
});

describe("users", () => {
  it("creates an account and verifies the password", async () => {
    const created = await createUser({
      email: "pam@example.com",
      name: "Pam",
      password: "cornbread1",
    });
    expect(created.email).toBe("pam@example.com");
    const verified = await verifyUser("pam@example.com", "cornbread1");
    expect(verified?.id).toBe(created.id);
    expect(await verifyUser("pam@example.com", "wrong-pass")).toBeNull();
  });

  it("rejects a duplicate email", async () => {
    await createUser({ email: "pam@example.com", name: "Pam", password: "cornbread1" });
    await expect(
      createUser({ email: "pam@example.com", name: "Pamela", password: "cornbread1" }),
    ).rejects.toBeInstanceOf(AccountError);
  });
});

describe("favorites and collections", () => {
  it("toggles favorites and stores recipes in a named collection", async () => {
    const user = await createUser({
      email: "cook@example.com",
      name: "Cook",
      password: "cornbread1",
    });
    await toggleFavorite(user.id, "weeknight-chili");
    expect(await listFavoriteSlugs(user.id)).toEqual(["weeknight-chili"]);
    await toggleFavorite(user.id, "weeknight-chili");
    expect(await listFavoriteSlugs(user.id)).toEqual([]);

    const collection = await createCollection(user.id, "Weeknight pots");
    await addToCollection(user.id, collection.id, "weeknight-chili");
    const listed = await listCollections(user.id);
    expect(listed[0]?.recipeSlugs).toContain("weeknight-chili");
    expect(listed[0]?.slug).toMatch(/weeknight-pots/);
  });
});

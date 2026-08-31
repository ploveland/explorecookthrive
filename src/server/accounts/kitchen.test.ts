import { afterEach, describe, expect, it } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCollection, addToCollection, listCollections } from "./collections";
import { listFavoriteSlugs, toggleFavorite } from "./favorites";
import { AccountError, createUser, getUserById, setPasswordByEmail, verifyUser } from "./users";
import { dataDir, newStorageId, writeConfinedJson } from "../fs/safe-path";
import { publishedRecipeSchema } from "../library/schema";

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "users"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "favorites"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "collections"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "library"), { recursive: true, force: true });
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

  it("replaces a forgotten password by email", async () => {
    await createUser({ email: "pam@example.com", name: "Pam", password: "cornbread1" });
    await setPasswordByEmail("pam@example.com", "castiron1");
    expect(await verifyUser("pam@example.com", "castiron1")).not.toBeNull();
    expect(await verifyUser("pam@example.com", "cornbread1")).toBeNull();
  });

  it("reads kitchens saved before Google login existed", async () => {
    const dir = path.join(process.cwd(), ".data", "users");
    await mkdir(dir, { recursive: true });
    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    await writeFile(
      path.join(dir, `${id}.json`),
      JSON.stringify({
        id,
        email: "old@example.com",
        name: "Old",
        passwordHash: "not-a-real-hash",
        createdAt: new Date().toISOString(),
      }),
    );
    const user = await getUserById(id);
    expect(user?.googleId).toBeNull();
    expect(user?.passwordHash).toBe("not-a-real-hash");
  });
});

describe("favorites and collections", () => {
  it("toggles favorites and stores recipes in a named collection", async () => {
    const user = await createUser({
      email: "cook@example.com",
      name: "Cook",
      password: "cornbread1",
    });
    const id = newStorageId();
    const recipe = publishedRecipeSchema.parse({
      id,
      slug: "weeknight-chili",
      jobId: newStorageId(),
      title: "Weeknight chili",
      description: "A pot of chili.",
      originalTitle: "Weeknight chili",
      sourceUrl: "https://example.com/chili",
      sourceSite: "example.com",
      sourceAuthor: null,
      servings: 6,
      prepMinutes: 15,
      cookMinutes: 40,
      cuisine: "American",
      category: "dinner",
      goals: ["healthier_overall"],
      dietary: [],
      preference: "balanced",
      tasteImpact: "minimal",
      tags: ["dinner"],
      ingredients: [
        {
          rawText: "1 onion",
          name: "onion",
          quantity: 1,
          unit: null,
          preparation: null,
          assumptionNote: null,
        },
      ],
      instructions: ["Simmer."],
      changes: [
        {
          original: "beef",
          suggested: "turkey",
          nutritionReason: "leaner",
          flavorEffect: "milder",
          textureEffect: "same",
        },
      ],
      wouldNotChange: [{ item: "chili powder", reason: "It is the dish." }],
      nutrition: null,
      provider: "mock",
      ownerId: user.id,
      ownerName: "Cook",
      visibility: "public",
      publishedAt: new Date().toISOString(),
      image: null,
    });
    await writeConfinedJson(dataDir("library"), recipe.id, JSON.stringify(recipe, null, 2));

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

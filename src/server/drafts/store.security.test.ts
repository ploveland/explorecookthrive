import { afterEach, describe, expect, it } from "vitest";
import { access, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { InvalidStorageIdError } from "../fs/safe-path";
import { getDraft, saveDraft, updateDraft } from "./store";

const GUEST = "11111111-1111-4111-8111-111111111111";

const recipe = {
  title: "Weeknight chili",
  description: "A pot of chili.",
  servings: 6,
  prepMinutes: 15,
  cookMinutes: 40,
  cuisine: null,
  category: null,
  ingredients: [
    {
      rawText: "1 onion",
      name: "onion",
      quantity: 1,
      unit: null,
      preparation: null,
    },
  ],
  instructions: ["Simmer."],
  sourceUrl: null,
  sourceSite: null,
  sourceAuthor: null,
  originalTitle: null,
  extractor: "paste" as const,
  confidence: "high" as const,
  warnings: [],
  assumptions: [],
};

const HOSTILE = [
  "../",
  "../../package",
  "..\\..\\package",
  "%2e%2e%2fpackage",
  "%2e%2e%2f%2e%2e%2fpackage",
  "/etc/passwd",
  "/tmp/ect-pwn",
  "....//....//package",
  "not-a-uuid",
];

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "drafts"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "canary.json"), { force: true });
});

describe("draft store path confinement", () => {
  it("reads and writes a valid application-generated draft id", async () => {
    const draft = await saveDraft(recipe, { guestId: GUEST });
    const loaded = await getDraft(draft.id);
    expect(loaded?.recipe.title).toBe("Weeknight chili");
    expect(loaded?.guestId).toBe(GUEST);
    const updated = await updateDraft(draft.id, { ...recipe, title: "Chili, confirmed" });
    expect(updated?.recipe.title).toBe("Chili, confirmed");
  });

  it("does not read files outside the draft directory", async () => {
    const pkg = await readFile(path.join(process.cwd(), "package.json"), "utf8");
    const canary = path.join(process.cwd(), ".data", "canary.json");
    await writeFile(canary, "secret-canary", "utf8");

    for (const id of HOSTILE) {
      await expect(getDraft(id)).rejects.toBeInstanceOf(InvalidStorageIdError);
    }

    expect(await readFile(path.join(process.cwd(), "package.json"), "utf8")).toBe(pkg);
    expect(await readFile(canary, "utf8")).toBe("secret-canary");
  });

  it("does not write files outside the draft directory", async () => {
    const pkg = await readFile(path.join(process.cwd(), "package.json"), "utf8");
    const canary = path.join(process.cwd(), ".data", "canary.json");
    await writeFile(canary, "secret-canary", "utf8");

    for (const id of HOSTILE) {
      await expect(updateDraft(id, recipe)).rejects.toBeInstanceOf(InvalidStorageIdError);
      await expect(saveDraft(recipe, { id, guestId: GUEST })).rejects.toBeInstanceOf(
        InvalidStorageIdError,
      );
    }

    expect(await readFile(path.join(process.cwd(), "package.json"), "utf8")).toBe(pkg);
    expect(await readFile(canary, "utf8")).toBe("secret-canary");
    await expect(
      access(path.join(process.cwd(), ".data", "drafts", "..", "canary.json")),
    ).resolves.toBeUndefined();
  });
});

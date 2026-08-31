import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { saveDraft } from "@/server/drafts/store";

const GUEST = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const account = {
  userId: null as string | null,
  guestId: GUEST as string | null,
  user: null,
};

vi.mock("@/server/accounts/session", () => ({
  currentAccount: async () => account,
}));

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

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "drafts"), { recursive: true, force: true });
  account.userId = null;
  account.guestId = GUEST;
});

describe("draft API path traversal and auth", () => {
  beforeEach(() => {
    account.guestId = GUEST;
    account.userId = null;
  });

  it("reads and writes the owner's draft", async () => {
    const { GET, PATCH } = await import("./route");
    const draft = await saveDraft(recipe, { guestId: GUEST });
    const read = await GET(new Request("http://localhost/api/recipes/drafts/" + draft.id), {
      params: Promise.resolve({ id: draft.id }),
    });
    expect(read.status).toBe(200);
    const body = (await read.json()) as { id: string };
    expect(body.id).toBe(draft.id);

    const written = await PATCH(
      new Request("http://localhost/api/recipes/drafts/" + draft.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: { ...recipe, title: "Chili, confirmed" } }),
      }),
      { params: Promise.resolve({ id: draft.id }) },
    );
    expect(written.status).toBe(200);
    expect(((await written.json()) as { recipe: { title: string } }).recipe.title).toBe(
      "Chili, confirmed",
    );
  });

  it("rejects unauthenticated read and write", async () => {
    const { GET, PATCH } = await import("./route");
    const draft = await saveDraft(recipe, { guestId: GUEST });
    account.guestId = null;
    account.userId = null;

    const read = await GET(new Request("http://localhost/api/recipes/drafts/" + draft.id), {
      params: Promise.resolve({ id: draft.id }),
    });
    expect(read.status).toBe(401);
    expect(JSON.stringify(await read.json())).not.toMatch(/\.data|passwd|\.\./);

    const written = await PATCH(
      new Request("http://localhost/api/recipes/drafts/" + draft.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe }),
      }),
      { params: Promise.resolve({ id: draft.id }) },
    );
    expect(written.status).toBe(401);
  });

  it("does not let another kitchen read or write a draft", async () => {
    const { GET, PATCH } = await import("./route");
    const draft = await saveDraft(recipe, { guestId: GUEST });
    account.guestId = OTHER;

    const read = await GET(new Request("http://localhost/api/recipes/drafts/" + draft.id), {
      params: Promise.resolve({ id: draft.id }),
    });
    expect(read.status).toBe(404);

    const written = await PATCH(
      new Request("http://localhost/api/recipes/drafts/" + draft.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: { ...recipe, title: "Stolen" } }),
      }),
      { params: Promise.resolve({ id: draft.id }) },
    );
    expect(written.status).toBe(404);
  });

  it("rejects traversal ids on read and write without touching files outside drafts", async () => {
    const { GET, PATCH } = await import("./route");
    const pkg = await readFile(path.join(process.cwd(), "package.json"), "utf8");
    const canary = path.join(process.cwd(), ".data", "canary.json");
    await writeFile(canary, "secret-canary", "utf8");

    const ids = [
      "../",
      "../../package",
      "..\\..\\package",
      "%2e%2e%2fpackage",
      "/etc/passwd",
      "....//....//package",
    ];

    for (const id of ids) {
      const read = await GET(new Request("http://localhost/api/recipes/drafts/" + encodeURIComponent(id)), {
        params: Promise.resolve({ id }),
      });
      expect(read.status, `GET ${id}`).toBe(400);
      const readBody = JSON.stringify(await read.json());
      expect(readBody).not.toMatch(/\.data|passwd|package\.json|\.\./);
      expect(readBody).toContain("invalid_id");

      const written = await PATCH(
        new Request("http://localhost/api/recipes/drafts/" + encodeURIComponent(id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe }),
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(written.status, `PATCH ${id}`).toBe(400);
      const writeBody = JSON.stringify(await written.json());
      expect(writeBody).not.toMatch(/\.data|passwd|package\.json/);
    }

    expect(await readFile(path.join(process.cwd(), "package.json"), "utf8")).toBe(pkg);
    expect(await readFile(canary, "utf8")).toBe("secret-canary");
    await rm(canary, { force: true });
  });
});

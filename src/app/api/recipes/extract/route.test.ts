import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const account = {
  userId: null as string | null,
  guestId: null as string | null,
  user: null,
};

vi.mock("@/server/accounts/session", () => ({
  currentAccount: async () => account,
}));

afterEach(() => {
  account.guestId = null;
  account.userId = null;
});

describe("recipe extract auth", () => {
  it("rejects import without a kitchen session", async () => {
    const response = await POST(
      new Request("http://localhost/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "paste",
          text: "Weeknight chili\n\nIngredients\n1 onion\n\nInstructions\nSimmer until thick.",
        }),
      }),
    );
    expect(response.status).toBe(401);
    const body = JSON.stringify(await response.json());
    expect(body).toContain("sign_in_required");
    expect(body).not.toMatch(/\.data|\.\.|passwd/);
  });
});

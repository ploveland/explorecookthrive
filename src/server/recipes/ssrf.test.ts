import { describe, expect, it } from "vitest";
import { ExtractError } from "./schema";
import { assertSafeHttpUrl } from "./ssrf";

describe("assertSafeHttpUrl", () => {
  it("rejects non-http protocols", async () => {
    await expect(assertSafeHttpUrl("ftp://example.com/recipe")).rejects.toMatchObject({
      code: "invalid_url",
    });
  });

  it("rejects localhost and loopback", async () => {
    await expect(assertSafeHttpUrl("http://localhost:3000/recipe")).rejects.toBeInstanceOf(
      ExtractError,
    );
    await expect(assertSafeHttpUrl("http://127.0.0.1/secret")).rejects.toMatchObject({
      code: "blocked_url",
    });
  });

  it("rejects private IPv4 ranges", async () => {
    await expect(assertSafeHttpUrl("http://10.0.0.8/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://192.168.1.20/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://172.16.0.4/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
  });

  it("rejects credentials in the URL", async () => {
    await expect(assertSafeHttpUrl("https://user:pass@example.com/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
  });
});

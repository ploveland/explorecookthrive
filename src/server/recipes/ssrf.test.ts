import { describe, expect, it } from "vitest";
import { ExtractError } from "./schema";
import { assertSafeHttpUrl, isBlockedIp } from "./ssrf";

const PUBLIC = "93.184.216.34";

describe("isBlockedIp", () => {
  it("blocks loopback, private, link-local, ULA, and mapped representations", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.8")).toBe(true);
    expect(isBlockedIp("192.168.1.20")).toBe(true);
    expect(isBlockedIp("172.16.0.4")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("100.64.0.1")).toBe(true);
    expect(isBlockedIp("0.0.0.0")).toBe(true);
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("fd12:3456:789a::1")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:10.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:192.168.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:172.16.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:169.254.169.254")).toBe(true);
    expect(isBlockedIp("::ffff:7f00:1")).toBe(true);
    expect(isBlockedIp("::ffff:a9fe:a9fe")).toBe(true);
  });

  it("allows public unicast addresses", () => {
    expect(isBlockedIp(PUBLIC)).toBe(false);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("2001:4860:4860::8888")).toBe(false);
  });
});

describe("assertSafeHttpUrl", () => {
  it("rejects non-http protocols", async () => {
    await expect(assertSafeHttpUrl("ftp://example.com/recipe")).rejects.toMatchObject({
      code: "invalid_url",
    });
    await expect(assertSafeHttpUrl("file:///etc/passwd")).rejects.toMatchObject({
      code: "invalid_url",
    });
  });

  it("rejects localhost and loopback literals", async () => {
    await expect(assertSafeHttpUrl("http://localhost:3000/recipe")).rejects.toBeInstanceOf(ExtractError);
    await expect(assertSafeHttpUrl("http://127.0.0.1/secret")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://[::1]/secret")).rejects.toMatchObject({
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
    await expect(assertSafeHttpUrl("http://169.254.169.254/latest/meta-data")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://100.64.0.1/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
  });

  it("rejects IPv6 private, link-local, and IPv4-mapped forms", async () => {
    await expect(assertSafeHttpUrl("http://[fc00::1]/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://[fe80::1]/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://[::ffff:127.0.0.1]/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://[::ffff:7f00:1]/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
  });

  it("rejects credentials and metadata hostnames", async () => {
    await expect(assertSafeHttpUrl("https://user:pass@example.com/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://metadata.google.internal/computeMetadata/v1/")).rejects.toMatchObject({
      code: "blocked_url",
    });
    await expect(assertSafeHttpUrl("http://kitchen.internal/recipe")).rejects.toMatchObject({
      code: "blocked_url",
    });
  });

  it("rejects DNS answers that include a private address", async () => {
    await expect(
      assertSafeHttpUrl("https://evil.example/recipe", async () => [
        { address: PUBLIC, family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    ).rejects.toMatchObject({ code: "blocked_url" });
  });

  it("pins the validated public address for a hostname", async () => {
    const target = await assertSafeHttpUrl("https://example.com/chili", async () => [
      { address: PUBLIC, family: 4 },
    ]);
    expect(target.hostname).toBe("example.com");
    expect(target.pin).toEqual({ address: PUBLIC, family: 4 });
    expect(target.href).toBe("https://example.com/chili");
  });

  it("rejects decimal and other alternate forms that normalize to loopback", async () => {
    await expect(assertSafeHttpUrl("http://2130706433/")).rejects.toBeInstanceOf(ExtractError);
  });
});

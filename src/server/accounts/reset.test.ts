import { afterEach, describe, expect, it } from "vitest";
import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { AccountError, createUser, verifyUser } from "./users";
import { consumePasswordReset, issuePasswordReset, requestPasswordReset } from "./reset";

const RESET_DIR = path.join(process.cwd(), ".data", "password-resets");
const USER_DIR = path.join(process.cwd(), ".data", "users");
const OUTBOX_DIR = path.join(process.cwd(), ".data", "mail-outbox");

afterEach(async () => {
  await rm(RESET_DIR, { recursive: true, force: true });
  await rm(USER_DIR, { recursive: true, force: true });
  await rm(OUTBOX_DIR, { recursive: true, force: true });
});

async function tokenFiles() {
  try {
    const names = await readdir(RESET_DIR);
    return names.filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }
}

describe("password reset", () => {
  it("updates the password and refuses a reused or expired link", async () => {
    const created = await createUser({
      email: "pam@example.com",
      name: "Pam Loveland",
      password: "cornbread1",
    });
    const issued = await issuePasswordReset("pam@example.com");
    expect(issued?.user.id).toBe(created.id);

    const files = await tokenFiles();
    expect(files).toHaveLength(1);
    const stored = await readFile(path.join(RESET_DIR, files[0]!), "utf8");
    expect(stored).not.toContain(issued!.rawToken);
    expect(stored).not.toContain("cornbread1");

    await consumePasswordReset(issued!.rawToken, "skillet99");
    expect(await verifyUser("pam@example.com", "skillet99")).toMatchObject({ id: created.id });
    expect(await verifyUser("pam@example.com", "cornbread1")).toBeNull();

    await expect(consumePasswordReset(issued!.rawToken, "another12")).rejects.toMatchObject({
      code: "invalid_token",
    });
  });

  it("does not create a token for an unknown email", async () => {
    const issued = await issuePasswordReset("nobody@example.com");
    expect(issued).toBeNull();
    expect(await tokenFiles()).toEqual([]);
  });

  it("replaces an unused token when a new reset is issued", async () => {
    await createUser({ email: "pam@example.com", name: "Pam", password: "cornbread1" });
    const first = await issuePasswordReset("pam@example.com");
    const second = await issuePasswordReset("pam@example.com");
    await expect(consumePasswordReset(first!.rawToken, "skillet99")).rejects.toBeInstanceOf(
      AccountError,
    );
    await consumePasswordReset(second!.rawToken, "skillet99");
    expect(await verifyUser("pam@example.com", "skillet99")).not.toBeNull();
  });

  it("rejects an expired token", async () => {
    await createUser({ email: "pam@example.com", name: "Pam", password: "cornbread1" });
    const issued = await issuePasswordReset("pam@example.com", { ttlMs: -1 });
    await expect(consumePasswordReset(issued!.rawToken, "skillet99")).rejects.toMatchObject({
      code: "invalid_token",
    });
    expect(await verifyUser("pam@example.com", "cornbread1")).not.toBeNull();
  });

  it("sends mail with a live link and never stores the raw token", async () => {
    await createUser({ email: "pam@example.com", name: "Pam Baker", password: "cornbread1" });
    const bodies: string[] = [];
    const result = await requestPasswordReset("pam@example.com", async (message) => {
      bodies.push(message.text);
      expect(message.subject).toMatch(/reset/i);
      expect(message.to).toBe("pam@example.com");
      expect(message.text).toContain("Hi Pam,");
      return "sent";
    });
    expect(result.mail).toBe("sent");
    expect(result.previewUrl).toBeUndefined();
    expect(bodies[0]).toMatch(/\/reset-password\?token=/);
    const match = bodies[0]!.match(/token=([^\s]+)/);
    expect(match?.[1]).toBeTruthy();
    const files = await tokenFiles();
    const stored = await readFile(path.join(RESET_DIR, files[0]!), "utf8");
    expect(stored).not.toContain(decodeURIComponent(match![1]!));
  });

  it("returns the same acceptance for an unknown email", async () => {
    const result = await requestPasswordReset("missing@example.com", async () => {
      throw new Error("should not send");
    });
    expect(result).toEqual({ accepted: true, mail: "no_account" });
  });

  it("rate-limits further emails without dropping an existing unused token", async () => {
    await createUser({ email: "pam@example.com", name: "Pam", password: "cornbread1" });
    const send = async () => "sent" as const;
    expect((await requestPasswordReset("pam@example.com", send)).mail).toBe("sent");
    const second = await requestPasswordReset("pam@example.com", send);
    expect(second.mail).toBe("sent");
    const third = await requestPasswordReset("pam@example.com", send);
    expect(third.mail).toBe("sent");
    const limited = await requestPasswordReset("pam@example.com", send);
    expect(limited.mail).toBe("rate_limited");

    const files = await tokenFiles();
    expect(files.length).toBeGreaterThan(0);
  });
});

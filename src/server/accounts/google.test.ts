import { afterEach, describe, expect, it } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  confirmGoogleLink,
  googleAuthConfigured,
  googleAuthFailureCopy,
  resolveGoogleLogin,
} from "./google";
import { createUser, getUserByEmail, getUserByGoogleId, getUserById, verifyUser } from "./users";

afterEach(async () => {
  await rm(path.join(process.cwd(), ".data", "users"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), ".data", "google-links"), { recursive: true, force: true });
});

const google = {
  sub: "google-sub-1",
  email: "pam@example.com",
  email_verified: true,
  name: "Pam",
};

describe("Google kitchen login", () => {
  it("creates a kitchen without a password for a new verified Google user", async () => {
    const result = await resolveGoogleLogin(google);
    expect(result.status).toBe("ok");
    const user = await getUserByEmail("pam@example.com");
    expect(user?.passwordHash).toBeNull();
    expect(user?.googleId).toBe("google-sub-1");
    expect(await getUserByGoogleId("google-sub-1")).toMatchObject({ email: "pam@example.com" });
    expect(await verifyUser("pam@example.com", "cornbread1")).toBeNull();
  });

  it("signs the same Google account back into the same kitchen", async () => {
    const first = await resolveGoogleLogin(google);
    const second = await resolveGoogleLogin(google);
    expect(first).toMatchObject({ status: "ok" });
    expect(second).toEqual(first);
  });

  it("does not auto-merge a password kitchen; password confirmation links Google", async () => {
    const created = await createUser({
      email: "pam@example.com",
      name: "Pam",
      password: "cornbread1",
    });
    const pending = await resolveGoogleLogin(google);
    expect(pending.status).toBe("link");
    expect((await getUserById(created.id))?.googleId).toBeNull();

    if (pending.status !== "link") throw new Error("expected link");
    const confirmed = await confirmGoogleLink(pending.token, "cornbread1");
    expect(confirmed.user.id).toBe(created.id);
    expect((await getUserById(created.id))?.googleId).toBe("google-sub-1");
  });

  it("refuses an unverified Google email", async () => {
    const result = await resolveGoogleLogin({ ...google, email_verified: false });
    expect(result).toEqual({ status: "denied", reason: "unverified" });
    expect(await getUserByEmail("pam@example.com")).toBeNull();
  });

  it("refuses a second Google id on an email that already has one", async () => {
    await resolveGoogleLogin(google);
    const result = await resolveGoogleLogin({ ...google, sub: "google-sub-2" });
    expect(result).toEqual({ status: "denied", reason: "conflict" });
    expect(await getUserByGoogleId("google-sub-2")).toBeNull();
  });

  it("refuses Google when the profile has no email", async () => {
    expect(await resolveGoogleLogin({ ...google, email: "" })).toEqual({
      status: "denied",
      reason: "missing_email",
    });
  });

  it("attaches Google to a passwordless kitchen that is missing googleId", async () => {
    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const dir = path.join(process.cwd(), ".data", "users");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${id}.json`),
      JSON.stringify({
        id,
        email: "pam@example.com",
        name: "Pam",
        passwordHash: null,
        googleId: null,
        createdAt: new Date().toISOString(),
      }),
    );
    const result = await resolveGoogleLogin(google);
    expect(result).toEqual({ status: "ok", userId: id });
    expect((await getUserById(id))?.googleId).toBe("google-sub-1");
  });

  it("refuses the wrong password on a pending Google link", async () => {
    await createUser({ email: "pam@example.com", name: "Pam", password: "cornbread1" });
    const pending = await resolveGoogleLogin(google);
    if (pending.status !== "link") throw new Error("expected link");
    await expect(confirmGoogleLink(pending.token, "wrong-pass")).rejects.toMatchObject({
      code: "invalid_credentials",
    });
    expect((await getUserByEmail("pam@example.com"))?.googleId).toBeNull();
  });

  it("hides Google unless both env vars are set", () => {
    const previousId = process.env.AUTH_GOOGLE_ID;
    const previousSecret = process.env.AUTH_GOOGLE_SECRET;
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    expect(googleAuthConfigured()).toBe(false);
    process.env.AUTH_GOOGLE_ID = "client-id";
    process.env.AUTH_GOOGLE_SECRET = "client-secret";
    expect(googleAuthConfigured()).toBe(true);
    if (previousId === undefined) delete process.env.AUTH_GOOGLE_ID;
    else process.env.AUTH_GOOGLE_ID = previousId;
    if (previousSecret === undefined) delete process.env.AUTH_GOOGLE_SECRET;
    else process.env.AUTH_GOOGLE_SECRET = previousSecret;
  });

  it("maps denied Google reasons to sign-in copy", () => {
    expect(googleAuthFailureCopy("google_unverified")).toMatch(/verified/);
    expect(googleAuthFailureCopy("google_conflict")).toMatch(/different kitchen/);
    expect(googleAuthFailureCopy("limit")).toBeNull();
  });
});

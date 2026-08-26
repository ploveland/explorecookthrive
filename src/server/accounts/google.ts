import { env } from "../env";
import { log } from "../log";
import { consumeGoogleLinkToken, issueGoogleLinkToken, readGoogleLinkToken } from "./google-link";
import {
  AccountError,
  createGoogleUser,
  getUserByEmail,
  getUserByGoogleId,
  linkGoogleId,
  verifyUser,
  type PublicUser,
} from "./users";

export function googleAuthConfigured() {
  return Boolean(env("AUTH_GOOGLE_ID") && env("AUTH_GOOGLE_SECRET"));
}

export function googleAuthFailureCopy(reason?: string | null) {
  switch (reason) {
    case "google_unverified":
      return "Google did not mark that email as verified. Use another Google account, or create a kitchen with a password.";
    case "google_conflict":
      return "That Google account or email is already tied to a different kitchen.";
    case "google_missing_email":
      return "Google did not send an email we can use. Try another account, or create a kitchen with a password.";
    default:
      return null;
  }
}

export type GoogleProfileInput = {
  sub?: string | null;
  email?: string | null;
  email_verified?: boolean | string | null;
  name?: string | null;
};

export type GoogleLoginResult =
  | { status: "ok"; userId: string }
  | { status: "link"; token: string; next: string }
  | { status: "denied"; reason: "unverified" | "missing_email" | "conflict" };

function emailVerified(value: GoogleProfileInput["email_verified"]) {
  return value === true || value === "true";
}

export async function resolveGoogleLogin(
  profile: GoogleProfileInput,
  options?: { next?: string | null },
): Promise<GoogleLoginResult> {
  const googleId = profile.sub?.trim() ?? "";
  const email = profile.email?.trim().toLowerCase() ?? "";
  if (!googleId || !email) return { status: "denied", reason: "missing_email" };
  if (!emailVerified(profile.email_verified)) return { status: "denied", reason: "unverified" };

  const byGoogle = await getUserByGoogleId(googleId);
  if (byGoogle) {
    return { status: "ok", userId: byGoogle.id };
  }

  const byEmail = await getUserByEmail(email);
  if (!byEmail) {
    const created = await createGoogleUser({
      email,
      name: profile.name?.trim() || "Cook",
      googleId,
    });
    log.info("auth.google_created", { userId: created.id });
    return { status: "ok", userId: created.id };
  }

  if (byEmail.googleId && byEmail.googleId !== googleId) {
    return { status: "denied", reason: "conflict" };
  }

  if (!byEmail.passwordHash) {
    await linkGoogleId(byEmail.id, googleId);
    log.info("auth.google_linked", { userId: byEmail.id });
    return { status: "ok", userId: byEmail.id };
  }

  const issued = await issueGoogleLinkToken({
    userId: byEmail.id,
    email: byEmail.email,
    googleId,
    next: options?.next,
  });
  log.info("auth.google_link_required", { userId: byEmail.id });
  return { status: "link", token: issued.raw, next: issued.next };
}

export async function peekGoogleLink(rawToken: string) {
  return readGoogleLinkToken(rawToken);
}

export async function confirmGoogleLink(rawToken: string, password: string): Promise<{
  user: PublicUser;
  next: string;
}> {
  const pending = await readGoogleLinkToken(rawToken);
  if (!pending) {
    throw new AccountError("invalid_token", "That Google link expired. Sign in with Google again.");
  }
  const user = await verifyUser(pending.email, password);
  if (!user || user.id !== pending.userId) {
    throw new AccountError("invalid_credentials", "That password did not match this kitchen.");
  }
  const consumed = await consumeGoogleLinkToken(rawToken);
  if (!consumed) {
    throw new AccountError("invalid_token", "That Google link expired. Sign in with Google again.");
  }
  const linked = await linkGoogleId(consumed.userId, consumed.googleId);
  log.info("auth.google_linked", { userId: linked.id });
  return { user: linked, next: consumed.next };
}

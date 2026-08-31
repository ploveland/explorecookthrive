import { randomBytes } from "node:crypto";
import { z } from "zod";
import { log } from "../log";
import { allowResetPreview, mailerConfigured, sendMail, type OutgoingMail } from "../mail/send";
import { siteUrl } from "../seo/site";
import {
  dataDir,
  listConfinedJsonIds,
  readConfinedJson,
  removeConfinedJson,
  sha256Hex,
  writeConfinedJson,
} from "../fs/safe-path";
import {
  PASSWORD_MIN_LENGTH,
  RESET_EMAILS_PER_HOUR,
  RESET_TOKEN_TTL_MS,
} from "./constants";
import { AccountError, getUserByEmail, updatePassword, type PublicUser } from "./users";

const DIR = dataDir("password-resets");
const RATE_DIR = dataDir("password-resets", "rate");

const tokenRecordSchema = z.object({
  userId: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  usedAt: z.string().nullable(),
});

const rateRecordSchema = z.object({
  sentAt: z.array(z.number()),
});

export type PasswordResetMailer = (message: OutgoingMail) => Promise<"sent" | "outbox">;

function hashToken(raw: string) {
  return sha256Hex(raw);
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function resetUrl(rawToken: string) {
  return `${siteUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export function buildResetMail(input: { name: string; email: string; rawToken: string }): OutgoingMail {
  const url = resetUrl(input.rawToken);
  const greeting = firstName(input.name);
  const text = [
    `Hi ${greeting},`,
    "",
    "Someone asked to reset the password for this Explore Cook Thrive kitchen.",
    "If that was you, open this link within the next hour:",
    "",
    url,
    "",
    "If you did not ask, you can ignore this. Your password stays the same.",
  ].join("\n");
  const html = `
    <p>Hi ${escapeHtml(greeting)},</p>
    <p>Someone asked to reset the password for this Explore Cook Thrive kitchen. If that was you, use this link within the next hour:</p>
    <p><a href="${escapeHtml(url)}">Choose a new password</a></p>
    <p>If you did not ask, ignore this. Your password stays the same.</p>
  `.trim();
  return {
    to: input.email,
    subject: "Reset your Explore Cook Thrive password",
    text,
    html,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function readToken(hash: string) {
  try {
    const raw = await readConfinedJson(DIR, hash, "hex64");
    return tokenRecordSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function listTokenHashes() {
  return listConfinedJsonIds(DIR, "hex64");
}

async function invalidateTokensForUser(userId: string) {
  const hashes = await listTokenHashes();
  await Promise.all(
    hashes.map(async (hash) => {
      const record = await readToken(hash);
      if (record?.userId === userId && !record.usedAt) {
        await removeConfinedJson(DIR, hash, "hex64");
      }
    }),
  );
}

async function readRate(userId: string) {
  try {
    const raw = await readConfinedJson(RATE_DIR, userId);
    return rateRecordSchema.parse(JSON.parse(raw));
  } catch {
    return { sentAt: [] as number[] };
  }
}

async function tooManyResets(userId: string, now: number) {
  const cutoff = now - 60 * 60 * 1000;
  const rate = await readRate(userId);
  const recent = rate.sentAt.filter((stamp) => stamp >= cutoff);
  return recent.length >= RESET_EMAILS_PER_HOUR;
}

async function recordSend(userId: string, now: number) {
  const cutoff = now - 60 * 60 * 1000;
  const rate = await readRate(userId);
  const sentAt = [...rate.sentAt.filter((stamp) => stamp >= cutoff), now];
  await writeConfinedJson(RATE_DIR, userId, JSON.stringify({ sentAt }, null, 2));
}

export async function issuePasswordReset(
  email: string,
  options?: { ttlMs?: number },
): Promise<{ rawToken: string; user: PublicUser } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  await invalidateTokensForUser(user.id);

  const rawToken = randomBytes(32).toString("base64url");
  const hash = hashToken(rawToken);
  const now = new Date();
  const ttlMs = options?.ttlMs ?? RESET_TOKEN_TTL_MS;
  await writeConfinedJson(
    DIR,
    hash,
    JSON.stringify(
      {
        userId: user.id,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
        usedAt: null,
      },
      null,
      2,
    ),
    "hex64",
  );
  return { rawToken, user };
}

export async function consumePasswordReset(rawToken: string, password: string): Promise<PublicUser> {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AccountError("invalid_input", "Use a password of at least 8 characters.");
  }
  const trimmed = rawToken.trim();
  if (!trimmed) {
    throw new AccountError("invalid_token", "This reset link is expired or already used.");
  }
  const hash = hashToken(trimmed);
  const record = await readToken(hash);
  if (!record || record.usedAt || Date.parse(record.expiresAt) <= Date.now()) {
    throw new AccountError("invalid_token", "This reset link is expired or already used.");
  }

  const updated = await updatePassword(record.userId, password);
  await writeConfinedJson(
    DIR,
    hash,
    JSON.stringify({ ...record, usedAt: new Date().toISOString() }, null, 2),
    "hex64",
  );
  await invalidateTokensForUser(record.userId);
  log.info("password.reset_complete", { success: true });
  return updated;
}

export type RequestPasswordResetResult = {
  accepted: true;
  mail: "sent" | "outbox" | "skipped" | "rate_limited" | "no_account";
  previewUrl?: string;
};

export async function requestPasswordReset(
  email: string,
  send: PasswordResetMailer = sendMail,
): Promise<RequestPasswordResetResult> {
  const existing = await getUserByEmail(email);
  if (!existing) {
    log.info("password.reset_requested", { mail: "no_account" });
    return { accepted: true, mail: "no_account" };
  }

  const now = Date.now();
  if (await tooManyResets(existing.id, now)) {
    log.warn("password.reset_requested", { mail: "rate_limited" });
    return { accepted: true, mail: "rate_limited" };
  }

  if (!mailerConfigured() && !allowResetPreview()) {
    log.error("password.reset_requested", { mail: "skipped" });
    return { accepted: true, mail: "skipped" };
  }

  const issued = await issuePasswordReset(email);
  if (!issued) {
    log.info("password.reset_requested", { mail: "no_account" });
    return { accepted: true, mail: "no_account" };
  }

  const message = buildResetMail({
    name: issued.user.name,
    email: issued.user.email,
    rawToken: issued.rawToken,
  });

  try {
    const mode = await send(message);
    await recordSend(issued.user.id, now);
    log.info("password.reset_requested", { mail: mode });
    const previewUrl = mode === "outbox" && allowResetPreview() ? resetUrl(issued.rawToken) : undefined;
    return { accepted: true, mail: mode, previewUrl };
  } catch {
    log.error("password.reset_requested", { mail: "skipped" });
    return { accepted: true, mail: "skipped" };
  }
}

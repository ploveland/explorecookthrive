import { randomBytes } from "node:crypto";
import { z } from "zod";
import { dataDir, readConfinedJson, removeConfinedJson, sha256Hex, writeConfinedJson } from "../fs/safe-path";

const DIR = dataDir("google-links");
const TTL_MS = 15 * 60 * 1000;

const recordSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  googleId: z.string(),
  next: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  usedAt: z.string().nullable(),
});

function hashToken(raw: string) {
  return sha256Hex(raw);
}

function safeNext(next?: string | null) {
  return next?.startsWith("/") ? next : "/kitchen";
}

export async function issueGoogleLinkToken(input: {
  userId: string;
  email: string;
  googleId: string;
  next?: string | null;
}) {
  const raw = randomBytes(32).toString("hex");
  const now = Date.now();
  const record = recordSchema.parse({
    userId: input.userId,
    email: input.email,
    googleId: input.googleId,
    next: safeNext(input.next),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
    usedAt: null,
  });
  await writeConfinedJson(DIR, hashToken(raw), JSON.stringify(record, null, 2), "hex64");
  return { raw, next: record.next };
}

export async function readGoogleLinkToken(raw: string) {
  try {
    const record = recordSchema.parse(JSON.parse(await readConfinedJson(DIR, hashToken(raw), "hex64")));
    if (record.usedAt) return null;
    if (Date.parse(record.expiresAt) <= Date.now()) return null;
    return record;
  } catch {
    return null;
  }
}

export async function consumeGoogleLinkToken(raw: string) {
  const record = await readGoogleLinkToken(raw);
  if (!record) return null;
  await removeConfinedJson(DIR, hashToken(raw), "hex64");
  return record;
}

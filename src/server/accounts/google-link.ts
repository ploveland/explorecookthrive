import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DIR = path.join(process.cwd(), ".data", "google-links");
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
  return createHash("sha256").update(raw).digest("hex");
}

function fileFor(hash: string) {
  return path.join(DIR, `${hash}.json`);
}

function safeNext(next?: string | null) {
  return next?.startsWith("/") ? next : "/kitchen";
}

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

export async function issueGoogleLinkToken(input: {
  userId: string;
  email: string;
  googleId: string;
  next?: string | null;
}) {
  await ensureDir();
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
  await writeFile(fileFor(hashToken(raw)), JSON.stringify(record, null, 2), "utf8");
  return { raw, next: record.next };
}

export async function readGoogleLinkToken(raw: string) {
  try {
    const record = recordSchema.parse(JSON.parse(await readFile(fileFor(hashToken(raw)), "utf8")));
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
  await rm(fileFor(hashToken(raw)), { force: true });
  return record;
}

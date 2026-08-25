import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "./constants";
import { hashPassword, verifyPassword } from "./password";

const DIR = path.join(process.cwd(), ".data", "users");

export const userRecordSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  passwordHash: z.string(),
  createdAt: z.string(),
});

export type UserRecord = z.infer<typeof userRecordSchema>;
export type PublicUser = Pick<UserRecord, "id" | "email" | "name">;

export class AccountError extends Error {
  constructor(
    public readonly code:
      | "email_taken"
      | "invalid_credentials"
      | "invalid_input"
      | "invalid_token"
      | "not_found",
    message: string,
  ) {
    super(message);
    this.name = "AccountError";
  }
}

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

function fileFor(id: string) {
  return path.join(DIR, `${id}.json`);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readAll(): Promise<UserRecord[]> {
  try {
    const names = await readdir(DIR);
    const users = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const raw = await readFile(path.join(DIR, name), "utf8");
          return userRecordSchema.parse(JSON.parse(raw));
        }),
    );
    return users;
  } catch {
    return [];
  }
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  try {
    const raw = await readFile(fileFor(id), "utf8");
    return userRecordSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = normalizeEmail(email);
  const users = await readAll();
  return users.find((user) => user.email === normalized) ?? null;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  if (!email || !name || input.password.length < PASSWORD_MIN_LENGTH) {
    throw new AccountError(
      "invalid_input",
      "Use a real email, a name, and a password of at least 8 characters.",
    );
  }
  if (await getUserByEmail(email)) {
    throw new AccountError("email_taken", "That email already has a kitchen.");
  }

  const user: UserRecord = {
    id: randomUUID(),
    email,
    name,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  await writeUser(user);
  return toPublicUser(user);
}

export async function verifyUser(email: string, password: string): Promise<PublicUser | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? toPublicUser(user) : null;
}

async function writeUser(user: UserRecord) {
  await ensureDir();
  await writeFile(fileFor(user.id), JSON.stringify(user, null, 2), "utf8");
}

export async function updatePassword(userId: string, password: string): Promise<PublicUser> {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AccountError(
      "invalid_input",
      "Use a password of at least 8 characters.",
    );
  }
  const user = await getUserById(userId);
  if (!user) {
    throw new AccountError("not_found", "That kitchen is no longer on this host.");
  }
  const next: UserRecord = {
    ...user,
    passwordHash: await hashPassword(password),
  };
  await writeUser(next);
  return toPublicUser(next);
}

export async function setPasswordByEmail(email: string, password: string): Promise<PublicUser> {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new AccountError("not_found", "No kitchen with that email.");
  }
  return updatePassword(user.id, password);
}

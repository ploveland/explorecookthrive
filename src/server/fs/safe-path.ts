import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type StorageIdKind = "uuid" | "hex64" | "numeric";

export class InvalidStorageIdError extends Error {
  readonly code = "invalid_id" as const;

  constructor() {
    super("That identifier is not valid.");
    this.name = "InvalidStorageIdError";
  }
}

const PATTERNS: Record<StorageIdKind, RegExp> = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  hex64: /^[0-9a-f]{64}$/i,
  numeric: /^[0-9]{10,16}$/,
};

const PUBLIC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATA_SEGMENT = /^[a-z][a-z0-9-]*$/;
const EVAL_BASENAME = /^[a-z0-9][a-z0-9._-]*\.json$/i;

const ENCODED_TRAVERSAL = /%(?:2e|2f|5c|00)/i;

export function newStorageId() {
  return randomUUID();
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function rejectUnsafeRaw(raw: string) {
  if (raw !== raw.trim() || raw.length === 0 || raw.length > 200) {
    throw new InvalidStorageIdError();
  }
  if (raw.includes("\0") || raw.includes("/") || raw.includes("\\") || raw.includes("..")) {
    throw new InvalidStorageIdError();
  }
  if (ENCODED_TRAVERSAL.test(raw) || raw.includes("%")) {
    throw new InvalidStorageIdError();
  }
  if (path.isAbsolute(raw) || /^[a-zA-Z]:/.test(raw)) {
    throw new InvalidStorageIdError();
  }
}

export function parseStorageId(raw: unknown, kind: StorageIdKind = "uuid"): string {
  if (typeof raw !== "string") throw new InvalidStorageIdError();
  rejectUnsafeRaw(raw);
  if (!PATTERNS[kind].test(raw)) throw new InvalidStorageIdError();
  return raw.toLowerCase();
}

export function parsePublicSlug(raw: unknown): string {
  if (typeof raw !== "string") throw new InvalidStorageIdError();
  rejectUnsafeRaw(raw);
  if (raw.length > 80 || !PUBLIC_SLUG.test(raw)) throw new InvalidStorageIdError();
  return raw;
}

export function dataDir(...segments: string[]) {
  if (segments.length === 0) throw new InvalidStorageIdError();
  for (const segment of segments) {
    if (!DATA_SEGMENT.test(segment)) throw new InvalidStorageIdError();
  }
  const root = path.resolve(process.cwd(), ".data");
  const resolved = path.resolve(root, ...segments);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new InvalidStorageIdError();
  }
  return resolved;
}

function assertInside(root: string, candidate: string) {
  const relative = path.relative(root, candidate);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative) || relative.includes("..")) {
    throw new InvalidStorageIdError();
  }
}

export async function confinedJsonPath(
  rootDir: string,
  id: string,
  kind: StorageIdKind = "uuid",
): Promise<string> {
  const safeId = parseStorageId(id, kind);
  const root = path.resolve(rootDir);
  const candidate = path.resolve(root, `${safeId}.json`);
  assertInside(root, candidate);
  if (path.dirname(candidate) !== root) throw new InvalidStorageIdError();
  if (path.basename(candidate) !== `${safeId}.json`) throw new InvalidStorageIdError();

  try {
    const rootReal = await realpath(root);
    const existing = await realpath(candidate);
    assertInside(rootReal, existing);
    return existing;
  } catch (error) {
    if (error instanceof InvalidStorageIdError) throw error;
    try {
      const rootReal = await realpath(root);
      const planned = path.resolve(rootReal, `${safeId}.json`);
      assertInside(rootReal, planned);
      return planned;
    } catch (inner) {
      if (inner instanceof InvalidStorageIdError) throw inner;
      return candidate;
    }
  }
}

export function confinedBasenamePath(rootDir: string, filename: string, pattern = EVAL_BASENAME) {
  if (typeof filename !== "string") throw new InvalidStorageIdError();
  if (
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..") ||
    filename.includes("%") ||
    path.isAbsolute(filename) ||
    !pattern.test(filename)
  ) {
    throw new InvalidStorageIdError();
  }
  const root = path.resolve(rootDir);
  const candidate = path.resolve(root, filename);
  assertInside(root, candidate);
  if (path.dirname(candidate) !== root) throw new InvalidStorageIdError();
  if (path.basename(candidate) !== filename) throw new InvalidStorageIdError();
  return candidate;
}

export async function readConfinedJson(
  rootDir: string,
  id: string,
  kind: StorageIdKind = "uuid",
): Promise<string> {
  const file = await confinedJsonPath(rootDir, id, kind);
  return readFile(file, "utf8");
}

export async function writeConfinedJson(
  rootDir: string,
  id: string,
  contents: string,
  kind: StorageIdKind = "uuid",
) {
  parseStorageId(id, kind);
  await mkdir(path.resolve(rootDir), { recursive: true });
  const file = await confinedJsonPath(rootDir, id, kind);
  await writeFile(file, contents, "utf8");
}

export async function removeConfinedJson(
  rootDir: string,
  id: string,
  kind: StorageIdKind = "uuid",
) {
  const file = await confinedJsonPath(rootDir, id, kind);
  await rm(file, { force: true });
}

export async function confinedJsonExists(
  rootDir: string,
  id: string,
  kind: StorageIdKind = "uuid",
) {
  try {
    const file = await confinedJsonPath(rootDir, id, kind);
    await access(file);
    return true;
  } catch (error) {
    if (error instanceof InvalidStorageIdError) throw error;
    return false;
  }
}

export async function listConfinedJsonIds(
  rootDir: string,
  kind: StorageIdKind = "uuid",
): Promise<string[]> {
  const root = path.resolve(rootDir);
  let names: string[];
  try {
    names = await readdir(root);
  } catch {
    return [];
  }
  const ids: string[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const id = name.slice(0, -".json".length);
    try {
      const safeId = parseStorageId(id, kind);
      const resolved = await confinedJsonPath(root, safeId, kind);
      if (path.basename(resolved) !== `${safeId}.json`) continue;
      ids.push(safeId);
    } catch {
      continue;
    }
  }
  return ids;
}

export async function readConfinedJsonRecords<T>(
  rootDir: string,
  parse: (raw: unknown) => T,
  kind: StorageIdKind = "uuid",
): Promise<T[]> {
  const ids = await listConfinedJsonIds(rootDir, kind);
  const records: T[] = [];
  for (const id of ids) {
    try {
      records.push(parse(JSON.parse(await readConfinedJson(rootDir, id, kind))));
    } catch {
      continue;
    }
  }
  return records;
}

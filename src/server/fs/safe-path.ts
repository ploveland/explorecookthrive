import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  InvalidStorageIdError,
  parsePublicSlug,
  parseStorageId,
  type StorageIdKind,
} from "./parse-id";

export { InvalidStorageIdError, parsePublicSlug, parseStorageId, type StorageIdKind };

const DATA_SEGMENT = /^[a-z][a-z0-9-]*$/;
const EVAL_BASENAME = /^[a-z0-9][a-z0-9._-]*\.json$/i;

export function newStorageId() {
  return randomUUID();
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

// Keep this module free of Node builtins. Client components import convert/schema,
// which validates draft IDs through these parsers. Pulling node:fs into that graph
// makes Turbopack fail the production build for /convert/goals/[draftId].

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
const ENCODED_TRAVERSAL = /%(?:2e|2f|5c|00)/i;

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
  if (/^[a-zA-Z]:/.test(raw)) {
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

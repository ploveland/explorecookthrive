import { describe, expect, it } from "vitest";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  InvalidStorageIdError,
  confinedJsonPath,
  dataDir,
  parsePublicSlug,
  parseStorageId,
  writeConfinedJson,
} from "./safe-path";

const UUID = "11111111-1111-4111-8111-111111111111";

const TRAVERSAL_IDS = [
  "../",
  "../../package",
  "../../../../../../etc/passwd",
  "..\\..\\package",
  "%2e%2e%2fpackage",
  "%2e%2e%2f%2e%2e%2fpackage",
  "/etc/passwd",
  "/tmp/ect-pwn",
  "C:\\Windows\\win.ini",
  "....//....//package",
  "..%2f..%2fpackage",
  "not a uuid",
  "",
  " ",
  "11111111-1111-4111-8111-111111111111.json",
];

describe("storage identifiers", () => {
  it("accepts a normal UUID", () => {
    expect(parseStorageId(UUID)).toBe(UUID);
  });

  it("rejects traversal, encoded traversal, absolute paths, and malformed ids", () => {
    for (const id of TRAVERSAL_IDS) {
      expect(() => parseStorageId(id), id).toThrow(InvalidStorageIdError);
      expect(() => parseStorageId(id), id).toThrow("That identifier is not valid.");
      expect(() => parseStorageId(id), id).not.toThrow(/\.data|passwd|package\.json|\//);
    }
  });

  it("rejects public slugs that are not an allowlisted token", () => {
    expect(parsePublicSlug("weeknight-chili")).toBe("weeknight-chili");
    expect(() => parsePublicSlug("../users")).toThrow(InvalidStorageIdError);
    expect(() => parsePublicSlug("%2e%2e%2fusers")).toThrow(InvalidStorageIdError);
    expect(() => parsePublicSlug("/etc/passwd")).toThrow(InvalidStorageIdError);
  });
});

describe("confined json paths", () => {
  const dir = path.join(process.cwd(), ".data", "path-guard");

  it("keeps a valid id inside the storage directory", async () => {
    const resolved = await confinedJsonPath(dir, UUID);
    expect(resolved.startsWith(path.resolve(dir) + path.sep)).toBe(true);
    expect(path.basename(resolved)).toBe(`${UUID}.json`);
  });

  it("never builds a path outside the directory from a hostile id", async () => {
    await mkdir(dir, { recursive: true });
    const canary = path.join(process.cwd(), ".data", "canary.json");
    await writeFile(canary, "untouched", "utf8");
    const pkg = await readFile(path.join(process.cwd(), "package.json"), "utf8");

    for (const id of TRAVERSAL_IDS) {
      await expect(confinedJsonPath(dir, id)).rejects.toBeInstanceOf(InvalidStorageIdError);
      await expect(writeConfinedJson(dir, id, "{\"pwned\":true}")).rejects.toBeInstanceOf(
        InvalidStorageIdError,
      );
    }

    expect(await readFile(canary, "utf8")).toBe("untouched");
    expect(await readFile(path.join(process.cwd(), "package.json"), "utf8")).toBe(pkg);
    await expect(access(path.join(process.cwd(), ".data", "path-guard", "..", "canary.json"))).resolves.toBeUndefined();
    await rm(canary, { force: true });
    await rm(dir, { recursive: true, force: true });
  });

  it("rejects dataDir segments that are not static allowlisted names", () => {
    expect(dataDir("drafts")).toBe(path.resolve(process.cwd(), ".data", "drafts"));
    expect(() => dataDir("..")).toThrow(InvalidStorageIdError);
    expect(() => dataDir("drafts", "../users")).toThrow(InvalidStorageIdError);
  });
});

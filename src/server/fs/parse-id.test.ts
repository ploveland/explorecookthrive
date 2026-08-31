import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("client-safe identifier parsers", () => {
  it("does not import Node builtins that would leak into convert/schema", () => {
    const dir = path.join(process.cwd(), "src", "server", "fs");
    for (const filename of ["parse-id.ts", "ids.ts"]) {
      const source = readFileSync(path.join(dir, filename), "utf8");
      expect(source, filename).not.toMatch(/from ["']node:/);
    }
  });
});

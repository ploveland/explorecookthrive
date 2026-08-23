import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ExtractedRecipe } from "./schema";

const DIR = path.join(process.cwd(), ".data", "url-cache");

function keyFor(url: string) {
  return createHash("sha256").update(url).digest("hex");
}

export async function readUrlCache(url: string): Promise<ExtractedRecipe | null> {
  try {
    const raw = await readFile(path.join(DIR, `${keyFor(url)}.json`), "utf8");
    return JSON.parse(raw) as ExtractedRecipe;
  } catch {
    return null;
  }
}

export async function writeUrlCache(url: string, recipe: ExtractedRecipe) {
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${keyFor(url)}.json`), JSON.stringify(recipe), "utf8");
}

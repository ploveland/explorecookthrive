import type { ExtractedRecipe } from "./schema";
import { dataDir, readConfinedJson, sha256Hex, writeConfinedJson } from "../fs/safe-path";

const DIR = dataDir("url-cache");

function keyFor(url: string) {
  return sha256Hex(url);
}

export async function readUrlCache(url: string): Promise<ExtractedRecipe | null> {
  try {
    const raw = await readConfinedJson(DIR, keyFor(url), "hex64");
    return JSON.parse(raw) as ExtractedRecipe;
  } catch {
    return null;
  }
}

export async function writeUrlCache(url: string, recipe: ExtractedRecipe) {
  await writeConfinedJson(DIR, keyFor(url), JSON.stringify(recipe), "hex64");
}

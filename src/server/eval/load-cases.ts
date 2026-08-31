import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { confinedBasenamePath } from "../fs/safe-path";
import { evalCaseSchema, type EvalCase } from "./score";

export function loadEvalCases(casesDir = path.join(process.cwd(), "evals/cases")): EvalCase[] {
  const root = path.resolve(casesDir);
  const files = readdirSync(root).filter((file) => file.endsWith(".json"));
  return files.flatMap((file) => {
    try {
      const location = confinedBasenamePath(root, file);
      const raw = JSON.parse(readFileSync(location, "utf8"));
      return [evalCaseSchema.parse(raw)];
    } catch {
      return [];
    }
  });
}

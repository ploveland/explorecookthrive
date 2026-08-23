import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { evalCaseSchema, type EvalCase } from "./score";

export function loadEvalCases(casesDir = path.join(process.cwd(), "evals/cases")): EvalCase[] {
  const files = readdirSync(casesDir).filter((file) => file.endsWith(".json"));
  return files.map((file) => {
    const raw = JSON.parse(readFileSync(path.join(casesDir, file), "utf8"));
    return evalCaseSchema.parse(raw);
  });
}

export const INTAKE_STORAGE_KEY = "ect:intake";

export type RecipeIntake = {
  mode: "paste" | "url";
  text?: string;
  url?: string;
  savedAt: string;
};

export function parseIntake(raw: string | null): RecipeIntake | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RecipeIntake;
    if (parsed.mode !== "paste" && parsed.mode !== "url") return null;
    return parsed;
  } catch {
    return null;
  }
}

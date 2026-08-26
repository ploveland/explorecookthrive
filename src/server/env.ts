/** Read server env at runtime. Bracket access avoids Next.js build-time inlining. */
export function env(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

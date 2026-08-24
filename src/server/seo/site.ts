export function siteUrl() {
  const raw = process.env.APP_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:43123";
  return raw.replace(/\/$/, "");
}

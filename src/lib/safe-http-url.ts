/** Allow only http(s) URLs with no credentials. Safe for href, src, and JSON-LD. */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function nullableSafeHttpUrl(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return safeHttpUrl(value);
}

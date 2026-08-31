/**
 * Serialize JSON-LD for embedding in a <script type="application/ld+json"> tag.
 * Encode characters that can break out of that HTML context rather than
 * stripping a few attacker strings.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

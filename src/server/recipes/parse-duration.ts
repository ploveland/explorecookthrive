const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i;

export function parseDurationToMinutes(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  const raw = String(value).trim();
  if (!raw) return null;

  const iso = raw.match(ISO_DURATION);
  if (iso) {
    const days = Number(iso[1] ?? 0);
    const hours = Number(iso[2] ?? 0);
    const minutes = Number(iso[3] ?? 0);
    const seconds = Number(iso[4] ?? 0);
    return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
  }

  const loose = raw.match(
    /(?:(\d+)\s*(?:hours?|hrs?|h))?[^0-9]*(?:(\d+)\s*(?:minutes?|mins?|m))?/i,
  );
  if (loose && (loose[1] || loose[2])) {
    return Number(loose[1] ?? 0) * 60 + Number(loose[2] ?? 0);
  }

  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? Math.max(0, Math.round(asNumber)) : null;
}

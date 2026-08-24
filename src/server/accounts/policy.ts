export const GUEST_CONVERSION_LIMIT = 2;
export const AUTH_DAILY_LIMIT = 10;

export type ConversionGate =
  | { ok: true }
  | { ok: false; code: "sign_in_required" | "daily_limit"; message: string };

export function conversionGate(input: {
  userId: string | null;
  guestConversions: number;
  userConversionsToday: number;
}): ConversionGate {
  if (input.userId) {
    if (input.userConversionsToday >= AUTH_DAILY_LIMIT) {
      return {
        ok: false,
        code: "daily_limit",
        message: "You have used today’s conversions. Come back tomorrow, or try a recipe already on the shelf.",
      };
    }
    return { ok: true };
  }

  if (input.guestConversions >= GUEST_CONVERSION_LIMIT) {
    return {
      ok: false,
      code: "sign_in_required",
      message: "Create a free kitchen to keep converting. The first two recipes stay with you.",
    };
  }
  return { ok: true };
}

export function isSameUtcDay(iso: string, now = new Date()) {
  return iso.slice(0, 10) === now.toISOString().slice(0, 10);
}

import { env } from "../env";

export type ConversionGate =
  | { ok: true }
  | { ok: false; code: "sign_in_required" | "daily_limit"; message: string };

function readLimit(name: string, fallback: number) {
  const raw = env(name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

/** 0 means unlimited. Default is open while the kitchen is growing. */
export function guestConversionLimit() {
  return readLimit("CONVERT_GUEST_LIMIT", 0);
}

/** 0 means unlimited. Default is open while the kitchen is growing. */
export function authDailyLimit() {
  return readLimit("CONVERT_AUTH_DAILY_LIMIT", 0);
}

export function conversionGate(input: {
  userId: string | null;
  guestConversions: number;
  userConversionsToday: number;
}): ConversionGate {
  if (input.userId) {
    const cap = authDailyLimit();
    if (cap > 0 && input.userConversionsToday >= cap) {
      return {
        ok: false,
        code: "daily_limit",
        message: "You have used today’s conversions. Come back tomorrow, or try a recipe already on the shelf.",
      };
    }
    return { ok: true };
  }

  const cap = guestConversionLimit();
  if (cap > 0 && input.guestConversions >= cap) {
    return {
      ok: false,
      code: "sign_in_required",
      message: "Create a free kitchen to keep converting. Guest conversions stay with you after you sign in.",
    };
  }
  return { ok: true };
}

export function remainingConversions(input: {
  userId: string | null;
  guestConversions: number;
  userConversionsToday: number;
}): number | null {
  if (input.userId) {
    const cap = authDailyLimit();
    if (cap === 0) return null;
    return Math.max(0, cap - input.userConversionsToday);
  }
  const cap = guestConversionLimit();
  if (cap === 0) return null;
  return Math.max(0, cap - input.guestConversions);
}

export function isSameUtcDay(iso: string, now = new Date()) {
  return iso.slice(0, 10) === now.toISOString().slice(0, 10);
}

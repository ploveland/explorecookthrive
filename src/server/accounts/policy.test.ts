import { describe, expect, it } from "vitest";
import { AUTH_DAILY_LIMIT, GUEST_CONVERSION_LIMIT, conversionGate } from "./policy";

describe("conversionGate", () => {
  it("lets a guest convert twice", () => {
    expect(
      conversionGate({ userId: null, guestConversions: 0, userConversionsToday: 0 }).ok,
    ).toBe(true);
    expect(
      conversionGate({
        userId: null,
        guestConversions: GUEST_CONVERSION_LIMIT - 1,
        userConversionsToday: 0,
      }).ok,
    ).toBe(true);
  });

  it("asks a guest to sign in after two conversions", () => {
    const gate = conversionGate({
      userId: null,
      guestConversions: GUEST_CONVERSION_LIMIT,
      userConversionsToday: 0,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("sign_in_required");
  });

  it("caps signed-in conversions per day", () => {
    const gate = conversionGate({
      userId: "user-1",
      guestConversions: 99,
      userConversionsToday: AUTH_DAILY_LIMIT,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("daily_limit");
  });
});

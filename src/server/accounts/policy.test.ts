import { afterEach, describe, expect, it } from "vitest";
import { authDailyLimit, conversionGate, guestConversionLimit, remainingConversions } from "./policy";

afterEach(() => {
  delete process.env.CONVERT_GUEST_LIMIT;
  delete process.env.CONVERT_AUTH_DAILY_LIMIT;
});

describe("conversionGate", () => {
  it("is unlimited when no caps are set", () => {
    expect(guestConversionLimit()).toBe(0);
    expect(authDailyLimit()).toBe(0);
    expect(
      conversionGate({ userId: null, guestConversions: 40, userConversionsToday: 0 }).ok,
    ).toBe(true);
    expect(
      conversionGate({ userId: "user-1", guestConversions: 0, userConversionsToday: 99 }).ok,
    ).toBe(true);
    expect(
      remainingConversions({ userId: "user-1", guestConversions: 0, userConversionsToday: 99 }),
    ).toBeNull();
    expect(
      remainingConversions({ userId: null, guestConversions: 40, userConversionsToday: 0 }),
    ).toBeNull();
  });

  it("lets a guest convert up to the guest cap", () => {
    process.env.CONVERT_GUEST_LIMIT = "2";
    expect(
      conversionGate({ userId: null, guestConversions: 0, userConversionsToday: 0 }).ok,
    ).toBe(true);
    expect(
      conversionGate({
        userId: null,
        guestConversions: 1,
        userConversionsToday: 0,
      }).ok,
    ).toBe(true);
  });

  it("asks a guest to sign in after the guest cap", () => {
    process.env.CONVERT_GUEST_LIMIT = "2";
    const gate = conversionGate({
      userId: null,
      guestConversions: 2,
      userConversionsToday: 0,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("sign_in_required");
  });

  it("caps signed-in conversions per day when a daily limit is set", () => {
    process.env.CONVERT_AUTH_DAILY_LIMIT = "10";
    const gate = conversionGate({
      userId: "user-1",
      guestConversions: 99,
      userConversionsToday: 10,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("daily_limit");
  });
});

describe("remainingConversions", () => {
  it("counts remaining guest conversions when capped", () => {
    process.env.CONVERT_GUEST_LIMIT = "2";
    expect(
      remainingConversions({ userId: null, guestConversions: 1, userConversionsToday: 0 }),
    ).toBe(1);
  });

  it("counts remaining signed-in conversions for the UTC day when capped", () => {
    process.env.CONVERT_AUTH_DAILY_LIMIT = "10";
    expect(
      remainingConversions({
        userId: "user-1",
        guestConversions: 99,
        userConversionsToday: 3,
      }),
    ).toBe(7);
  });
});

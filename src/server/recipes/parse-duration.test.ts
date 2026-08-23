import { describe, expect, it } from "vitest";
import { parseDurationToMinutes } from "./parse-duration";

describe("parseDurationToMinutes", () => {
  it("parses ISO-8601 durations", () => {
    expect(parseDurationToMinutes("PT20M")).toBe(20);
    expect(parseDurationToMinutes("PT1H30M")).toBe(90);
    expect(parseDurationToMinutes("P1DT2H")).toBe(1560);
  });

  it("parses loose English times", () => {
    expect(parseDurationToMinutes("20 minutes")).toBe(20);
    expect(parseDurationToMinutes("1 hour 15 minutes")).toBe(75);
  });
});

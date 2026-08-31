import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY } from "./csp";

describe("Content-Security-Policy", () => {
  it("restricts script, object, and framing as defense in depth", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("base-uri 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'self'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-eval");
  });
});

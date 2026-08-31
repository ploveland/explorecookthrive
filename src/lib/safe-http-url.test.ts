import { describe, expect, it } from "vitest";
import { nullableSafeHttpUrl, safeHttpUrl } from "./safe-http-url";

describe("safeHttpUrl", () => {
  it("allows http and https", () => {
    expect(safeHttpUrl("https://example.com/chili")).toBe("https://example.com/chili");
    expect(safeHttpUrl("http://example.com/chili")).toBe("http://example.com/chili");
  });

  it("rejects javascript, data, and credentialed URLs", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("JAVASCRIPT:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeHttpUrl("vbscript:msgbox(1)")).toBeNull();
    expect(safeHttpUrl("https://user:pass@example.com/chili")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
    expect(nullableSafeHttpUrl(null)).toBeNull();
  });
});

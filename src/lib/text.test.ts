import { describe, expect, it } from "vitest";
import { truncateText } from "./text";

describe("truncateText", () => {
  it("trims and collapses whitespace", () => {
    expect(truncateText("  hello   world  ", 100)).toBe("hello world");
    expect(truncateText("line1\nline2", 100)).toBe("line1 line2");
  });

  it("returns unchanged text when within maxLength", () => {
    expect(truncateText("short", 10)).toBe("short");
  });

  it("truncates without ellipsis by default", () => {
    expect(truncateText("hello world", 5)).toBe("hello");
  });

  it("appends custom ellipsis when provided", () => {
    expect(truncateText("hello world", 5, { ellipsis: "…" })).toBe("hello…");
  });
});

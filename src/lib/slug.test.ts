import { describe, expect, it } from "vitest";
import { normalizeSlug } from "./slug";

describe("normalizeSlug", () => {
  it("returns empty string for blank input", () => {
    expect(normalizeSlug("")).toBe("");
    expect(normalizeSlug("   ")).toBe("");
  });

  it("lowercases ascii and replaces non-alphanumeric runs with hyphens", () => {
    expect(normalizeSlug("Hello World")).toBe("hello-world");
    expect(normalizeSlug("Foo---Bar!!")).toBe("foo-bar");
    expect(normalizeSlug("-leading-trailing-")).toBe("leading-trailing");
  });

  it("falls back to github-slugger for non-ascii input", () => {
    const slug = normalizeSlug("你好世界");
    expect(slug.length).toBeGreaterThan(0);
    expect(slug).not.toMatch(/^-|-$/);
  });

  it("respects maxLength", () => {
    expect(normalizeSlug("hello-world-example", 5)).toBe("hello");
  });
});

import { describe, expect, it } from "vitest";
import { buildPageNumbers } from "./pagination";

describe("buildPageNumbers", () => {
  it("returns all pages when totalPages <= 7", () => {
    expect(buildPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("folds middle pages when totalPages > 7", () => {
    expect(buildPageNumbers(5, 10)).toEqual([1, 4, 5, 6, 10]);
    expect(buildPageNumbers(1, 10)).toEqual([1, 2, 10]);
    expect(buildPageNumbers(10, 10)).toEqual([1, 9, 10]);
  });

  it("filters out-of-range neighbor pages", () => {
    expect(buildPageNumbers(2, 10)).toEqual([1, 2, 3, 10]);
  });
});

import { describe, expect, it } from "vitest";
import { SearchPageSchema } from "./page";

describe("SearchPageSchema", () => {
  it("applies defaults for empty input", () => {
    const result = SearchPageSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pageNo).toBe(1);
      expect(result.data.pageSize).toBe(10);
      expect(result.data.keyword).toBe("");
      expect(result.data.sortOrder).toBe("desc");
    }
  });

  it("coerces string page numbers", () => {
    const result = SearchPageSchema.safeParse({ pageNo: "2", pageSize: "20" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pageNo).toBe(2);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("rejects invalid sortOrder", () => {
    expect(SearchPageSchema.safeParse({ sortOrder: "invalid" }).success).toBe(false);
  });

  it("rejects pageSize over 100", () => {
    expect(SearchPageSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  PostCreateSchema,
  PostDetailSchema,
  PostViewSchema,
} from "./post";

describe("PostDetailSchema", () => {
  it("fails when both id and slug are empty", () => {
    const result = PostDetailSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "id和slug不能同时为空")).toBe(true);
    }
  });

  it("accepts id only", () => {
    const result = PostDetailSchema.safeParse({ id: "post-1" });
    expect(result.success).toBe(true);
  });

  it("accepts slug only", () => {
    const result = PostDetailSchema.safeParse({ slug: "hello-world" });
    expect(result.success).toBe(true);
  });
});

describe("PostViewSchema", () => {
  it("requires non-empty slug after trim", () => {
    expect(PostViewSchema.safeParse({ slug: "my-post" }).success).toBe(true);
    expect(PostViewSchema.safeParse({ slug: "  " }).success).toBe(false);
    expect(PostViewSchema.safeParse({}).success).toBe(false);
  });
});

describe("PostCreateSchema", () => {
  const validBase = {
    title: "Test Post",
    slug: "test-post",
    content: "Body content",
    excerpt: "Short excerpt",
  };

  it("accepts minimal valid payload", () => {
    const result = PostCreateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug format", () => {
    const result = PostCreateSchema.safeParse({ ...validBase, slug: "Bad_Slug" });
    expect(result.success).toBe(false);
  });

  it("requires tag id or name", () => {
    const result = PostCreateSchema.safeParse({
      ...validBase,
      tags: [{}],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "id和name不能同时为空")).toBe(true);
    }
  });

  it("accepts tag with name only", () => {
    const result = PostCreateSchema.safeParse({
      ...validBase,
      tags: [{ name: "typescript" }],
    });
    expect(result.success).toBe(true);
  });
});

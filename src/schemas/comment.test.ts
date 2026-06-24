import { describe, expect, it } from "vitest";
import { CommentCreateSchema, CommentDeleteSchema } from "./comment";

describe("CommentCreateSchema", () => {
  it("accepts valid comment", () => {
    const result = CommentCreateSchema.safeParse({
      slug: "hello-world",
      content: "Nice post!",
    });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = CommentCreateSchema.safeParse({ content: "hi" });
    expect(result.success).toBe(false);
  });

  it("enforces content length 2–2000", () => {
    expect(CommentCreateSchema.safeParse({ slug: "a", content: "x" }).success).toBe(false);
    expect(
      CommentCreateSchema.safeParse({ slug: "a", content: "a".repeat(2001) }).success,
    ).toBe(false);
  });
});

describe("CommentDeleteSchema", () => {
  it("requires at least one id", () => {
    expect(CommentDeleteSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(CommentDeleteSchema.safeParse({ ids: ["c1"] }).success).toBe(true);
  });
});

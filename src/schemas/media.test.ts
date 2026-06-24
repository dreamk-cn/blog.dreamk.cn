import { describe, expect, it } from "vitest";
import { ExternalMediaSchema } from "./media";

describe("ExternalMediaSchema", () => {
  it("accepts http(s) URL", () => {
    const result = ExternalMediaSchema.safeParse({
      url: "https://cdn.example.com/image.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-http schemes", () => {
    const result = ExternalMediaSchema.safeParse({
      url: "ftp://example.com/file.png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = ExternalMediaSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { RegisterSchema, SendRegisterCodeSchema } from "./auth";

describe("SendRegisterCodeSchema", () => {
  it("accepts valid email", () => {
    expect(SendRegisterCodeSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(SendRegisterCodeSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  const validBase = {
    name: "Dreamk",
    email: "user@example.com",
    code: "123456",
    password: "Abcdef12",
    confirmPassword: "Abcdef12",
  };

  it("accepts valid registration payload", () => {
    expect(RegisterSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects weak password", () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      password: "weakpass",
      confirmPassword: "weakpass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmPassword", () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      confirmPassword: "Abcdef99",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "两次输入的密码不一致")).toBe(true);
    }
  });
});

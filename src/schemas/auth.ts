import z from "zod";

import { PasswordRegex } from "@/lib/auth-validators";

/** 登录表单（与 credentials 提交字段一致） */
export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email("邮箱格式不正确")),
  password: z.string().min(1, "请输入密码"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/** 从校验结果取各字段首条错误文案，供 HeroUI TextField.validate / 提交前检查 */
export function getLoginFieldErrors(data: {
  email: string;
  password: string;
}): { email: string; password: string } {
  const result = LoginSchema.safeParse(data);
  if (result.success) {
    return { email: "", password: "" };
  }
  const out = { email: "", password: "" };
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key === "email" && !out.email) {
      out.email = issue.message;
    }
    if (key === "password" && !out.password) {
      out.password = issue.message;
    }
  }
  return out;
}

/** 发送注册验证码（与 POST /api/auth/register/send-code 校验一致） */
export const SendRegisterCodeSchema = z.object({
  email: z.string().trim().pipe(z.email("邮箱格式不正确")),
});

export type SendRegisterCodeInput = z.infer<typeof SendRegisterCodeSchema>;

/** 注册表单（与 POST /api/auth/register 校验一致） */
export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, "用户名至少 2 个字符"),
    email: z.string().trim().pipe(z.email("邮箱格式不正确")),
    code: z.string().regex(/^\d{6}$/, "请输入 6 位验证码"),
    password: z
      .string()
      .regex(
        PasswordRegex,
        "密码至少 8 位，且需包含大写、小写字母与数字",
      ),
    confirmPassword: z.string().min(1, "请再次输入密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export function getRegisterFieldErrors(data: {
  name: string;
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}): {
  name: string;
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
} {
  const empty = {
    name: "",
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  };
  const result = RegisterSchema.safeParse(data);
  if (result.success) {
    return { ...empty };
  }
  const out = { ...empty };
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (
      (key === "name" ||
        key === "email" ||
        key === "code" ||
        key === "password" ||
        key === "confirmPassword") &&
      !out[key]
    ) {
      out[key] = issue.message;
    }
  }
  return out;
}

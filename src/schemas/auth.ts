import z from "zod";

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

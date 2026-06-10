/** 邮箱规范化：去首尾空白并转小写，空值返回空字符串 */
export function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

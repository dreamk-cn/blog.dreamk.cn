import z from "zod";
import zValue from ".";

// 更新用户状态（封禁/解禁）
export const UserUpdateStatusSchema = z.object({
  id: zValue(z.string()),
  status: zValue(z.enum(["BAN", "VALID"]))
})

// 可扩展的列表查询参数（目前仅keyword/status）
export const UserListQuerySchema = z.object({
  keyword: zValue(z.string().optional()),
  status: zValue(z.enum(["BAN", "VALID", "DELETED"], '状态错误').optional()),
})
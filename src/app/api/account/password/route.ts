import { ResponseCode } from "@/config/response-code";
import { fail, notFound, ok } from "@/lib/api-response";
import { parseJson, withUser } from "@/lib/route-handler";
import { ChangePasswordSchema, SetPasswordSchema } from "@/schemas/auth";
import {
  changePassword,
  getAccountSecurity,
  setPassword,
} from "@/services/user-service";
import { NextResponse } from "next/server";

export const POST = withUser(async (request, user) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const userId = user.session.user.id;
  const security = await getAccountSecurity(userId);
  if (!security) {
    return notFound("用户不存在");
  }

  if (security.hasPassword) {
    const parsed = ChangePasswordSchema.parse(json ?? {});
    const result = await changePassword({
      userId,
      currentPassword: parsed.currentPassword,
      password: parsed.password,
    });
    if (result.error === "not_found") {
      return notFound("用户不存在");
    }
    if (result.error === "not_set") {
      return fail(ResponseCode.FAIL, "请先设置密码");
    }
    if (result.error === "invalid_current") {
      return fail(ResponseCode.FAIL, "当前密码不正确");
    }
    return ok(result.data, "密码已修改");
  }

  const parsed = SetPasswordSchema.parse(json ?? {});
  const result = await setPassword({
    userId,
    password: parsed.password,
  });
  if (result.error === "not_found") {
    return notFound("用户不存在");
  }
  if (result.error === "already_set") {
    return fail(ResponseCode.FAIL, "已设置过密码，请使用修改密码");
  }
  return ok(result.data, "密码已设置");
}, "设置密码失败");

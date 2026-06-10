import { ResponseCode } from "@/config/response-code";
import { conflict, fail, ok, tooManyRequests } from "@/lib/api-response";
import { getRequestIp } from "@/lib/request-ip";
import { parseJson, withRoute } from "@/lib/route-handler";
import { SendRegisterCodeSchema } from "@/schemas/auth";
import { sendRegisterVerificationCode } from "@/services/register-verify-service";
import { NextResponse } from "next/server";

export const POST = withRoute(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = SendRegisterCodeSchema.parse(json ?? {});
  const ip = getRequestIp(request);

  const result = await sendRegisterVerificationCode({
    email: parsed.email,
    ip,
  });

  if ("error" in result && result.error) {
    if (result.code === ResponseCode.CONFLICT) {
      return conflict(result.error);
    }
    if (result.code === ResponseCode.TOO_MANY_REQUESTS) {
      return tooManyRequests(result.error, result.retryAfterSec);
    }
    return fail(ResponseCode.FAIL, result.error);
  }

  return ok(null, "验证码已发送");
}, "发送注册验证码失败");

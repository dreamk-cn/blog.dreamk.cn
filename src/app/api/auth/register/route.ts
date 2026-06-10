import { ResponseCode } from "@/config/response-code";
import { conflict, fail, ok, tooManyRequests } from "@/lib/api-response";
import { consumeAuthRegisterRateLimit } from "@/lib/cache";
import { getRequestIp } from "@/lib/request-ip";
import { parseJson, withRoute } from "@/lib/route-handler";
import { RegisterSchema } from "@/schemas/auth";
import { verifyRegisterCode } from "@/services/register-verify-service";
import { registerUser } from "@/services/user-service";
import { NextResponse } from "next/server";

export const POST = withRoute(async (request) => {
  const ip = getRequestIp(request);
  const rate = await consumeAuthRegisterRateLimit(ip);
  if (!rate.ok) {
    return tooManyRequests(
      `注册过于频繁，每 ${rate.windowSec} 秒最多 ${rate.limit} 次，请稍后再试`,
      rate.retryAfterSec,
    );
  }

  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = RegisterSchema.parse(json ?? {});
  const verified = await verifyRegisterCode(parsed.email, parsed.code);
  if ("error" in verified) {
    return fail(ResponseCode.FAIL, verified.error);
  }

  const result = await registerUser(parsed);
  if (result.error) {
    return conflict(result.error);
  }

  return ok(null, "注册成功");
}, "注册失败");

import { ResponseCode } from "@/config/response-code";
import { conflict, fail, internalError, ok, tooManyRequests, zodFail } from "@/lib/api-response";
import { getRequestIp } from "@/lib/request-ip";
import { SendRegisterCodeSchema } from "@/schemas/auth";
import { sendRegisterVerificationCode } from "@/services/register-verify-service";
import { type NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodFail(error.issues[0]?.message || "参数错误");
    }
    return internalError("Internal server error");
  }
}

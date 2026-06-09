import { fail, internalError, ok, tooManyRequests, zodFail } from "@/lib/api-response";
import { consumeAuthRegisterRateLimit } from "@/lib/cache";
import { getRequestIp } from "@/lib/request-ip";
import { RegisterSchema } from "@/schemas/auth";
import { verifyRegisterCode } from "@/services/register-verify-service";
import { registerUser } from "@/services/user-service";
import { type NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const rate = await consumeAuthRegisterRateLimit(ip);
    if (!rate.ok) {
      return tooManyRequests(
        `注册过于频繁，每 ${rate.windowSec} 秒最多 ${rate.limit} 次，请稍后再试`,
        rate.retryAfterSec,
      );
    }

    const json = await request.json();
    const parsed = RegisterSchema.parse(json ?? {});

    const verified = await verifyRegisterCode(parsed.email, parsed.code);
    if ("error" in verified) {
      return fail(400, verified.error);
    }

    const result = await registerUser(parsed);
    if (result.error) {
      return fail(409, result.error);
    }

    return ok(null, "注册成功");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodFail(error.issues[0]?.message || "参数错误");
    }
    return internalError("Internal server error");
  }
}
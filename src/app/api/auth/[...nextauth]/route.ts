import { handlers } from "@/auth";
import { tooManyRequests } from "@/lib/api-response";
import { consumeAuthLoginRateLimit } from "@/lib/cache";
import { getRequestIp } from "@/lib/request-ip";
import { type NextRequest } from "next/server";

const CREDENTIALS_CALLBACK_PATH = "/api/auth/callback/dreamk-credentials";

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname === CREDENTIALS_CALLBACK_PATH) {
    const ip = getRequestIp(request);
    const rate = await consumeAuthLoginRateLimit(ip);
    if (!rate.ok) {
      const message = `登录尝试过于频繁，每 ${rate.windowSec} 秒最多 ${rate.limit} 次，请稍后再试`;
      return tooManyRequests(message, rate.retryAfterSec);
    }
  }

  return handlers.POST(request);
}

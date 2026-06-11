import { env } from "@/config/env";
import type { NextRequest } from "next/server";

function readForwardedIp(request: NextRequest | Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip");
}

/**
 * 解析客户端 IP。
 * - 生产 + TRUST_PROXY=true：信任 X-Forwarded-For / X-Real-IP
 * - 开发直连：尽量读转发头，否则回退 127.0.0.1（本地访问）
 */
export function getRequestIp(request: NextRequest | Request): string | null {
  const forwarded = readForwardedIp(request);
  if (env.trustProxy) {
    return forwarded;
  }

  if (env.isDev) {
    return forwarded ?? "127.0.0.1";
  }

  return null;
}

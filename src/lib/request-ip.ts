import type { NextRequest } from "next/server";

/** 从反向代理头解析客户端 IP（优先 X-Forwarded-For 首段） */
export function getRequestIp(request: NextRequest | Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip");
}

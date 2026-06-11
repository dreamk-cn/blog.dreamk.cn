import type { Prisma } from "@/generated/prisma";
import type { NextRequest } from "next/server";
import { detectVisitor } from "./detect-visitor";
import { getRequestIp } from "@/lib/request-ip";

export function buildAccessLogEntry(
  request: NextRequest,
  userId?: string,
): Prisma.AccessLogCreateInput {
  const { pathname, search } = request.nextUrl;
  const userAgent = request.headers.get("user-agent");
  const visitor = detectVisitor(userAgent);

  return {
    method: request.method,
    pathname,
    query: search || null,
    ip: getRequestIp(request) ?? undefined,
    userAgent: userAgent ?? undefined,
    referer: request.headers.get("referer") ?? undefined,
    visitorKind: visitor.kind,
    botName: visitor.botName,
    userId: userId ?? undefined,
  };
}

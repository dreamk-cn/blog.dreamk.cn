import { internalError, zodFail } from "@/lib/api-response";
import { mapPrismaError } from "@/lib/prisma-errors";
import { requireAdmin } from "@/lib/route-auth";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export async function parseJson(request: Request): Promise<unknown | NextResponse> {
  try {
    return await request.json();
  } catch {
    return zodFail("请求体格式错误");
  }
}

export function handleRouteError(err: unknown, logLabel?: string): NextResponse {
  if (err instanceof z.ZodError) {
    return zodFail(err.issues[0]?.message || "参数错误");
  }
  const prismaErr = mapPrismaError(err);
  if (prismaErr) return prismaErr;
  if (logLabel) {
    console.error(logLabel, err);
  } else {
    console.error(err);
  }
  return internalError();
}

type AdminAuth = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;

export function withRoute(
  handler: (request: NextRequest) => Promise<NextResponse>,
  logLabel?: string,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (err) {
      return handleRouteError(err, logLabel);
    }
  };
}

export function withAdmin(
  handler: (request: NextRequest, auth: AdminAuth) => Promise<NextResponse>,
  logLabel?: string,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const auth = await requireAdmin();
      if (!auth.ok) return auth.response;
      return await handler(request, auth);
    } catch (err) {
      return handleRouteError(err, logLabel);
    }
  };
}

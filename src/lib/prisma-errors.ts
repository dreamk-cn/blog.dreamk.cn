import { ResponseCode } from "@/config/response-code";
import { Prisma } from "@/generated/prisma";
import { fail, notFound } from "@/lib/api-response";
import type { NextResponse } from "next/server";

export type PrismaErrorMessages = {
  P2002?: string;
  P2025?: string;
  P2003?: string;
};

const DEFAULT_MESSAGES: Required<PrismaErrorMessages> = {
  P2002: "数据已存在，请更换后重试",
  P2025: "关联资源不存在",
  P2003: "存在关联数据，无法操作",
};

export function mapPrismaError(
  err: unknown,
  messages?: PrismaErrorMessages,
): NextResponse | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  const msg = { ...DEFAULT_MESSAGES, ...messages };

  switch (err.code) {
    case "P2002":
      return fail(ResponseCode.FAIL, msg.P2002);
    case "P2025":
      return notFound(msg.P2025);
    case "P2003":
      return fail(ResponseCode.FAIL, msg.P2003);
    default:
      return null;
  }
}

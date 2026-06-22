import { ok } from "@/lib/api-response";
import { parseJson, withAdmin } from "@/lib/route-handler";
import { AccessLogListSchema, AccessLogPurgeSchema } from "@/schemas/access-log";
import { listAccessLogs, purgeAccessLogs } from "@/services/access-log-service";
import { NextResponse } from "next/server";

function parseDateBoundary(value: string, endOfDay: boolean): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && trimmed.length <= 10) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

export const GET = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl;
  const parsed = AccessLogListSchema.parse({
    pageNo: searchParams.get("pageNo"),
    pageSize: searchParams.get("pageSize"),
    sortOrder: searchParams.get("sortOrder"),
    pathname: searchParams.get("pathname") || undefined,
    ip: searchParams.get("ip") || undefined,
    visitorKind: searchParams.get("visitorKind") || undefined,
    userId: searchParams.get("userId") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  const { pageNo, pageSize, sortOrder, pathname, ip, visitorKind, userId, from, to } = parsed;
  const { list, total, usersById } = await listAccessLogs({
    pageNo,
    pageSize,
    sortOrder,
    pathname: pathname || undefined,
    ip: ip || undefined,
    visitorKind,
    userId: userId || undefined,
    from: from ? parseDateBoundary(from, false) : undefined,
    to: to ? parseDateBoundary(to, true) : undefined,
  });

  return ok(
    {
      list,
      total,
      usersById,
      totalPages: Math.ceil(total / pageSize),
      pageNo,
      pageSize,
    },
    "获取访问日志成功",
  );
}, "获取访问日志失败");

const purgeScopeMessages: Record<
  "all" | "7" | "30" | "60",
  (count: number) => string
> = {
  all: (count) => `已清除全部访问日志（${count} 条）`,
  "7": (count) => `已清除 7 天外的访问日志（${count} 条）`,
  "30": (count) => `已清除 30 天外的访问日志（${count} 条）`,
  "60": (count) => `已清除 60 天外的访问日志（${count} 条）`,
};

export const POST = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { scope } = AccessLogPurgeSchema.parse(json ?? {});
  const deleted = await purgeAccessLogs(scope);

  return ok({ deleted }, purgeScopeMessages[scope](deleted));
}, "清除访问日志失败");

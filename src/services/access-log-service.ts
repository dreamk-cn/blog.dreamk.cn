import type { AccessLog, VisitorKind } from "@/generated/prisma";
import { buildAccessLogEntry } from "@/lib/access-log/build-entry";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export type AccessLogListFilters = {
  pageNo: number;
  pageSize: number;
  sortOrder: "asc" | "desc";
  pathname?: string;
  ip?: string;
  visitorKind?: VisitorKind;
  userId?: string;
  from?: Date;
  to?: Date;
};

export type AccessLogUserPreview = {
  id: string;
  name: string | null;
  email: string;
};

export async function recordAccessLog(input: {
  request: NextRequest;
  userId?: string;
}) {
  const data = buildAccessLogEntry(input.request, input.userId);
  return prisma.accessLog.create({ data });
}

export async function listAccessLogs(filters: AccessLogListFilters) {
  const { pageNo, pageSize, sortOrder, pathname, ip, visitorKind, userId, from, to } = filters;

  const where = {
    ...(pathname ? { pathname: { contains: pathname, mode: "insensitive" as const } } : {}),
    ...(ip ? { ip: { contains: ip } } : {}),
    ...(visitorKind ? { visitorKind } : {}),
    ...(userId ? { userId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [list, total] = await Promise.all([
    prisma.accessLog.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      skip: (pageNo - 1) * pageSize,
      take: pageSize,
    }),
    prisma.accessLog.count({ where }),
  ]);

  const usersById = await resolveAccessLogUsers(list);

  return { list, total, usersById };
}

export async function resolveAccessLogUsers(
  logs: Pick<AccessLog, "userId">[],
): Promise<Record<string, AccessLogUserPreview>> {
  const userIds = [...new Set(logs.map((log) => log.userId).filter(Boolean))] as string[];
  if (userIds.length === 0) {
    return {};
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  return Object.fromEntries(users.map((user) => [user.id, user]));
}

export async function purgeOldAccessLogs(retentionDays: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await prisma.accessLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}

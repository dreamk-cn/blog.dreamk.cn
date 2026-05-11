import { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listUsers(params: { keyword?: string; status?: UserStatus }) {
  const keyword = params.keyword ?? "";
  const query: Prisma.UserFindManyArgs = {
    orderBy: { createdAt: "desc" },
    where: {},
  };

  if (keyword) {
    query.where = {
      ...query.where,
      OR: [
        { name: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
      ],
    };
  }
  if (params.status) {
    query.where = {
      ...query.where,
      status: params.status,
    };
  }

  return prisma.user.findMany(query);
}

export async function updateUserStatus(params: { id: string; status: UserStatus }) {
  const exist = await prisma.user.findUnique({ where: { id: params.id } });
  if (!exist) return { error: "用户不存在" as const };

  const data = await prisma.user.update({
    where: { id: params.id },
    data: { status: params.status },
  });
  return { data };
}

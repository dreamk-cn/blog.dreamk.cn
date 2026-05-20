import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

type LinkStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";

type FriendLinkInput = {
  name: string;
  url: string;
  email?: string;
  avatar?: string;
  description?: string;
  status?: LinkStatus;
  sortOrder?: number;
};

function normalizeUrl(url: string) {
  return url.trim();
}

export async function listFriendLinks(input?: { keyword?: string; status?: LinkStatus }) {
  const query: Prisma.FriendLinkFindManyArgs = {
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
  };

  const keyword = input?.keyword?.trim();
  if (keyword || input?.status) {
    query.where = {
      ...(input?.status ? { status: input.status } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: "insensitive" } },
              { url: { contains: keyword, mode: "insensitive" } },
              { email: { contains: keyword, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }

  return prisma.friendLink.findMany(query);
}

export async function createFriendLink(input: FriendLinkInput) {
  const normalizedUrl = normalizeUrl(input.url);
  const exists = await prisma.friendLink.findUnique({ where: { url: normalizedUrl } });
  if (exists) return { error: "该友链 URL 已存在" as const };

  const data = await prisma.friendLink.create({
    data: {
      name: input.name.trim(),
      url: normalizedUrl,
      email: input.email?.trim(),
      avatar: input.avatar?.trim(),
      description: input.description?.trim(),
      status: input.status ?? "PENDING",
      sortOrder: input.sortOrder ?? 0,
    },
  });

  return { data };
}

export async function updateFriendLink(input: FriendLinkInput & { id: string }) {
  const normalizedUrl = normalizeUrl(input.url);
  const exists = await prisma.friendLink.findFirst({
    where: {
      url: normalizedUrl,
      NOT: { id: input.id },
    },
  });
  if (exists) return { error: "该友链 URL 已存在" as const };

  const data = await prisma.friendLink.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      url: normalizedUrl,
      email: input.email?.trim(),
      avatar: input.avatar?.trim(),
      description: input.description?.trim(),
      status: input.status ?? "PENDING",
      sortOrder: input.sortOrder ?? 0,
    },
  });

  return { data };
}

export async function deleteFriendLink(id: string) {
  const exists = await prisma.friendLink.findUnique({ where: { id } });
  if (!exists) return { error: "友链不存在" as const };

  await prisma.friendLink.delete({ where: { id } });
  return { data: null };
}

export async function listApprovedFriendLinks() {
  return prisma.friendLink.findMany({
    where: {
      status: "APPROVED",
    },
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      url: true,
    },
  });
}

import { $Enums } from "@prisma/client";
import { prisma } from "@/libs/prisma";

type CommentStatus = $Enums.CommentStatus;

export async function listApprovedCommentsBySlug(slug: string) {
  return prisma.comment.findMany({
    where: {
      post: {
        slug,
        status: "PUBLISHED",
      },
      status: "APPROVED",
      parentId: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export async function createComment(input: {
  slug: string;
  content: string;
  parentId?: string;
  userId?: string;
  userIp?: string;
  userAgent?: string;
  status: CommentStatus;
}) {
  const { slug, content, parentId, userId, userIp, userAgent, status } = input;
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    return null;
  }

  const created = await prisma.comment.create({
    data: {
      content,
      postId: post.id,
      parentId: parentId || null,
      userId: userId || null,
      userIp: userIp || null,
      userAgent: userAgent || null,
      status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return created;
}

export async function listComments(params: {
  pageNo: number;
  pageSize: number;
  keyword?: string;
  sortOrder: "asc" | "desc";
  status?: CommentStatus;
}) {
  const { pageNo, pageSize, keyword = "", sortOrder, status } = params;
  const where = {
    ...(keyword
      ? {
          OR: [
            { content: { contains: keyword, mode: "insensitive" as const } },
            { post: { title: { contains: keyword, mode: "insensitive" as const } } },
            { post: { slug: { contains: keyword, mode: "insensitive" as const } } },
            { user: { name: { contains: keyword, mode: "insensitive" as const } } },
            { user: { email: { contains: keyword, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip: (pageNo - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: sortOrder },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total };
}

export async function updateCommentStatus(input: { id: string; status: CommentStatus }) {
  const { id, status } = input;
  const exists = await prisma.comment.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    return null;
  }
  return prisma.comment.update({
    where: { id },
    data: { status },
  });
}

export async function softDeleteComments(ids: string[]) {
  return prisma.comment.updateMany({
    where: { id: { in: ids } },
    data: { status: "DELETED" },
  });
}

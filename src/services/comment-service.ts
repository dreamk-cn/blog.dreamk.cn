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

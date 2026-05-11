import { $Enums, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CommentStatus = $Enums.CommentStatus;

const commentUserSelect = {
  id: true,
  name: true,
  image: true,
} as const;

type FlatApprovedComment = Prisma.CommentGetPayload<{
  include: { user: { select: typeof commentUserSelect } };
}>;

function buildThreadedRootsFromFlat(
  comments: FlatApprovedComment[],
  rootIdsInOrder: string[],
  replyPaging: { skip: number; take: number },
) {
  const commentMap = new Map(comments.map((item) => [item.id, item]));

  return rootIdsInOrder.map((rootId) => {
    const parent = commentMap.get(rootId);
    if (!parent) {
      throw new Error(`Missing root comment ${rootId}`);
    }
    const allReplies = comments
      .filter((item) => item.parentId !== null && isDescendantOf(item, parent.id, commentMap))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const totalReplyCount = allReplies.length;
    const sliced = allReplies.slice(replyPaging.skip, replyPaging.skip + replyPaging.take);

    const replies = sliced.map((reply) => {
      const replyTo = reply.parentId ? commentMap.get(reply.parentId)?.user ?? null : null;
      return {
        ...reply,
        replyTo,
        replies: [],
      };
    });

    return {
      ...parent,
      replyTo: null,
      replies,
      totalReplyCount,
    };
  });
}

async function collectApprovedSubtreeForRoots(postId: string, rootRows: FlatApprovedComment[]) {
  const collected = new Map<string, FlatApprovedComment>();
  for (const row of rootRows) {
    collected.set(row.id, row);
  }
  let frontier = rootRows.map((r) => r.id);

  while (frontier.length > 0) {
    const children = await prisma.comment.findMany({
      where: {
        postId,
        status: "APPROVED",
        parentId: { in: frontier },
      },
      include: {
        user: {
          select: commentUserSelect,
        },
      },
    });
    if (children.length === 0) {
      break;
    }
    for (const child of children) {
      collected.set(child.id, child);
    }
    frontier = children.map((c) => c.id);
  }

  return [...collected.values()];
}

export async function listApprovedCommentsBySlug(
  slug: string,
  options?: { rootSkip?: number; rootTake?: number; replySkip?: number; replyTake?: number },
) {
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  if (!post) {
    return { comments: [], totalRootCount: 0 };
  }

  const rootSkip = options?.rootSkip ?? 0;
  const rootTake = options?.rootTake ?? 20;
  const replySkip = options?.replySkip ?? 0;
  const replyTake = options?.replyTake ?? 5;

  const totalRootCount = await prisma.comment.count({
    where: {
      postId: post.id,
      status: "APPROVED",
      parentId: null,
    },
  });

  const rootRows = await prisma.comment.findMany({
    where: {
      postId: post.id,
      status: "APPROVED",
      parentId: null,
    },
    orderBy: { createdAt: "desc" },
    skip: rootSkip,
    take: rootTake,
    include: {
      user: {
        select: commentUserSelect,
      },
    },
  });

  if (rootRows.length === 0) {
    return { comments: [], totalRootCount };
  }

  const flat = await collectApprovedSubtreeForRoots(post.id, rootRows);
  const rootIdsInOrder = rootRows.map((r) => r.id);
  const comments = buildThreadedRootsFromFlat(flat, rootIdsInOrder, { skip: replySkip, take: replyTake });

  return { comments, totalRootCount };
}

export async function listApprovedRepliesForRootSlug(
  slug: string,
  rootId: string,
  options: { skip: number; take: number },
) {
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  if (!post) {
    return null;
  }

  const rootRow = await prisma.comment.findFirst({
    where: {
      id: rootId,
      postId: post.id,
      status: "APPROVED",
      parentId: null,
    },
    include: {
      user: {
        select: commentUserSelect,
      },
    },
  });

  if (!rootRow) {
    return null;
  }

  const flat = await collectApprovedSubtreeForRoots(post.id, [rootRow]);
  const commentMap = new Map(flat.map((item) => [item.id, item]));

  const allReplies = flat
    .filter((item) => item.parentId !== null && isDescendantOf(item, rootId, commentMap))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const totalReplyCount = allReplies.length;
  const sliced = allReplies.slice(options.skip, options.skip + options.take);

  const replies = sliced.map((reply) => {
    const replyTo = reply.parentId ? commentMap.get(reply.parentId)?.user ?? null : null;
    return {
      ...reply,
      replyTo,
      replies: [],
    };
  });

  return { replies, totalReplyCount };
}

export async function countApprovedCommentsByPostSlug(slug: string) {
  return prisma.comment.count({
    where: {
      status: "APPROVED",
      post: {
        slug,
        status: "PUBLISHED",
      },
    },
  });
}

function isDescendantOf(
  comment: { id: string; parentId: string | null },
  rootId: string,
  commentMap: Map<string, { id: string; parentId: string | null }>,
) {
  let currentParentId = comment.parentId;
  while (currentParentId) {
    if (currentParentId === rootId) {
      return true;
    }
    const parent = commentMap.get(currentParentId);
    if (!parent) {
      return false;
    }
    currentParentId = parent.parentId;
  }
  return false;
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

  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: {
        id: parentId,
        postId: post.id,
        status: "APPROVED",
      },
      select: { id: true },
    });
    if (!parent) {
      return null;
    }
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

export async function softDeleteOwnCommentBySlug(input: { slug: string; id: string; userId: string }) {
  const { slug, id, userId } = input;
  const target = await prisma.comment.findFirst({
    where: {
      id,
      userId,
      post: {
        slug,
        status: "PUBLISHED",
      },
      status: {
        not: "DELETED",
      },
    },
    select: {
      id: true,
      postId: true,
    },
  });

  if (!target) {
    return null;
  }

  const descendants = new Set<string>([target.id]);
  let frontier = [target.id];

  while (frontier.length > 0) {
    const children = await prisma.comment.findMany({
      where: {
        postId: target.postId,
        status: {
          not: "DELETED",
        },
        parentId: { in: frontier },
      },
      select: { id: true },
    });
    if (children.length === 0) {
      break;
    }
    frontier = [];
    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        frontier.push(child.id);
      }
    }
  }

  const ids = [...descendants];
  const [approvedCount, deletedRootCount] = await prisma.$transaction([
    prisma.comment.count({
      where: {
        id: { in: ids },
        status: "APPROVED",
      },
    }),
    prisma.comment.count({
      where: {
        id: { in: ids },
        status: "APPROVED",
        parentId: null,
      },
    }),
    prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: { status: "DELETED" },
    }),
  ]);

  return {
    deletedIds: ids,
    deletedApprovedCount: approvedCount,
    deletedRootCount,
  };
}

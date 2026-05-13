import { $Enums, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CommentStatus = $Enums.CommentStatus;

const commentUserSelect = {
  id: true,
  name: true,
  image: true,
} as const;

const approvedCommentInclude = {
  user: {
    select: commentUserSelect,
  },
} satisfies Prisma.CommentInclude;

type FlatApprovedComment = Prisma.CommentGetPayload<{
  include: { user: { select: typeof commentUserSelect } };
}>;

async function getPublishedPostIdBySlug(slug: string) {
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  return post?.id ?? null;
}

async function loadApprovedRootComment(postId: string, rootId: string) {
  return prisma.comment.findFirst({
    where: {
      id: rootId,
      postId,
      status: "APPROVED",
      parentId: null,
    },
    include: approvedCommentInclude,
  });
}

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
  const postId = await getPublishedPostIdBySlug(slug);
  if (!postId) {
    return { comments: [], totalRootCount: 0 };
  }

  const rootSkip = options?.rootSkip ?? 0;
  const rootTake = options?.rootTake ?? 20;
  const replySkip = options?.replySkip ?? 0;
  const replyTake = options?.replyTake ?? 5;

  const totalRootCount = await prisma.comment.count({
    where: {
      postId,
      status: "APPROVED",
      parentId: null,
    },
  });

  const rootRows = await prisma.comment.findMany({
    where: {
      postId,
      status: "APPROVED",
      parentId: null,
    },
    orderBy: { createdAt: "desc" },
    skip: rootSkip,
    take: rootTake,
    include: approvedCommentInclude,
  });

  if (rootRows.length === 0) {
    return { comments: [], totalRootCount };
  }

  const flat = await collectApprovedSubtreeForRoots(postId, rootRows);
  const rootIdsInOrder = rootRows.map((r) => r.id);
  const comments = buildThreadedRootsFromFlat(flat, rootIdsInOrder, { skip: replySkip, take: replyTake });

  return { comments, totalRootCount };
}

export async function listApprovedRepliesForRootSlug(
  slug: string,
  rootId: string,
  options: { skip: number; take: number },
) {
  const postId = await getPublishedPostIdBySlug(slug);
  if (!postId) {
    return null;
  }

  const rootRow = await loadApprovedRootComment(postId, rootId);
  if (!rootRow) {
    return null;
  }

  const flat = await collectApprovedSubtreeForRoots(postId, [rootRow]);
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

/** 邮件深链：定位某条已审核评论在分页中的位置（根楼层 + 楼内线序） */
export async function getApprovedCommentAnchorMeta(slug: string, commentId: string) {
  const postId = await getPublishedPostIdBySlug(slug);
  if (!postId) {
    return null;
  }

  const target = await prisma.comment.findFirst({
    where: {
      id: commentId,
      postId,
      status: "APPROVED",
    },
    select: { id: true, parentId: true },
  });
  if (!target) {
    return null;
  }

  let rootId = target.id;
  let currentId = target.parentId;
  for (let depth = 0; depth < 64; depth += 1) {
    if (!currentId) {
      rootId = target.id;
      break;
    }
    const node: { id: string; parentId: string | null } | null = await prisma.comment.findFirst({
      where: { id: currentId, postId },
      select: { id: true, parentId: true },
    });
    if (!node) {
      return null;
    }
    if (!node.parentId) {
      rootId = node.id;
      break;
    }
    currentId = node.parentId;
  }

  const isTargetRoot = target.id === rootId;

  const roots = await prisma.comment.findMany({
    where: {
      postId,
      status: "APPROVED",
      parentId: null,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const rootIndex = roots.findIndex((r) => r.id === rootId);
  if (rootIndex === -1) {
    return null;
  }

  const totalRootCount = roots.length;

  let replyFlatIndex: number | null = null;
  let totalReplyCount = 0;

  if (!isTargetRoot) {
    const rootRow = await loadApprovedRootComment(postId, rootId);
    if (!rootRow) {
      return null;
    }

    const flat = await collectApprovedSubtreeForRoots(postId, [rootRow]);
    const commentMap = new Map(flat.map((item) => [item.id, item]));
    const allReplies = flat
      .filter((item) => item.parentId !== null && isDescendantOf(item, rootId, commentMap))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    totalReplyCount = allReplies.length;
    const idx = allReplies.findIndex((r) => r.id === target.id);
    if (idx === -1) {
      return null;
    }
    replyFlatIndex = idx;
  }

  return {
    rootId,
    rootIndex,
    isTargetRoot,
    replyFlatIndex,
    totalRootCount,
    totalReplyCount,
  };
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
  const postId = await getPublishedPostIdBySlug(slug);
  if (!postId) {
    return null;
  }

  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: {
        id: parentId,
        postId,
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
      postId,
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
    select: { id: true, status: true },
  });
  if (!exists) {
    return null;
  }
  const previousStatus = exists.status;
  const updated = await prisma.comment.update({
    where: { id },
    data: { status },
  });
  return { updated, previousStatus };
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

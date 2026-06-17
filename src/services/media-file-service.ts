import { MediaCategory, MediaSource, Prisma } from "@/generated/prisma";
import { deleteObject, uploadImageToKey } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

export type CreateMediaFileInput = {
  source: MediaSource;
  key?: string | null;
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  category?: MediaCategory;
  userId: string;
};

const activeMediaSelect = {
  id: true,
  url: true,
  source: true,
  category: true,
  originalName: true,
} satisfies Prisma.MediaFileSelect;

export async function createMediaFile(input: CreateMediaFileInput) {
  return prisma.mediaFile.create({
    data: {
      source: input.source,
      key: input.key ?? null,
      url: input.url,
      originalName: input.originalName ?? null,
      mimeType: input.mimeType ?? null,
      size: input.size ?? null,
      category: input.category ?? "ASSET",
      userId: input.userId,
    },
    select: activeMediaSelect,
  });
}

export async function getActiveMediaFileById(id: string) {
  return prisma.mediaFile.findFirst({
    where: {
      id,
      status: "ACTIVE",
    },
    select: activeMediaSelect,
  });
}

async function validateActiveMediaFileIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const files = await prisma.mediaFile.findMany({
    where: {
      id: { in: uniqueIds },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (files.length !== uniqueIds.length) {
    return { error: "存在无效或已删除的媒体文件" as const };
  }

  return uniqueIds;
}

export async function syncPostCoverMedia(postId: string, mediaFileIds: string[]) {
  const validated = await validateActiveMediaFileIds(mediaFileIds);
  if (!Array.isArray(validated)) return validated;

  if (validated.length === 0) {
    await prisma.postCoverMedia.deleteMany({ where: { postId } });
    return { ok: true as const };
  }

  await prisma.$transaction([
    prisma.postCoverMedia.deleteMany({
      where: {
        postId,
        mediaFileId: { notIn: validated },
      },
    }),
    ...validated.map((mediaFileId, sortOrder) =>
      prisma.postCoverMedia.upsert({
        where: {
          postId_mediaFileId: { postId, mediaFileId },
        },
        create: { postId, mediaFileId, sortOrder },
        update: { sortOrder },
      }),
    ),
  ]);

  return { ok: true as const };
}

export async function syncPostContentMedia(postId: string, mediaFileIds: string[]) {
  const validated = await validateActiveMediaFileIds(mediaFileIds);
  if (!Array.isArray(validated)) return validated;

  if (validated.length === 0) {
    await prisma.postContentMedia.deleteMany({ where: { postId } });
    return { ok: true as const };
  }

  await prisma.$transaction([
    prisma.postContentMedia.deleteMany({
      where: {
        postId,
        mediaFileId: { notIn: validated },
      },
    }),
    prisma.postContentMedia.createMany({
      data: validated.map((mediaFileId) => ({ postId, mediaFileId })),
      skipDuplicates: true,
    }),
  ]);

  return { ok: true as const };
}

export async function softDeleteMediaFile(id: string) {
  return prisma.mediaFile.update({
    where: { id },
    data: { status: "DELETED" },
  });
}

export type ListMediaFilesParams = {
  pageNo: number;
  pageSize: number;
  keyword?: string;
  category?: MediaCategory | "ALL";
  source?: MediaSource | "ALL";
  sortBy?: "createdAt" | "size";
  sortOrder?: "asc" | "desc";
};

const mediaListSelect = {
  id: true,
  url: true,
  source: true,
  category: true,
  originalName: true,
  mimeType: true,
  size: true,
  createdAt: true,
  _count: {
    select: {
      coverUsages: true,
      contentUsages: true,
    },
  },
} satisfies Prisma.MediaFileSelect;

export type MediaFileListItem = {
  id: string;
  url: string;
  source: MediaSource;
  category: MediaCategory;
  originalName: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: Date;
  usageCount: number;
};

function buildMediaListWhere(params: ListMediaFilesParams): Prisma.MediaFileWhereInput {
  const where: Prisma.MediaFileWhereInput = { status: "ACTIVE" };

  if (params.category && params.category !== "ALL") {
    where.category = params.category;
  }
  if (params.source && params.source !== "ALL") {
    where.source = params.source;
  }
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim();
    where.OR = [
      { originalName: { contains: kw, mode: "insensitive" } },
      { url: { contains: kw, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listMediaFiles(params: ListMediaFilesParams) {
  const { pageNo, pageSize, sortBy = "createdAt", sortOrder = "desc" } = params;
  const where = buildMediaListWhere(params);
  const skip = (pageNo - 1) * pageSize;

  const orderBy: Prisma.MediaFileOrderByWithRelationInput =
    sortBy === "size" ? { size: sortOrder } : { createdAt: sortOrder };

  const [rows, total] = await Promise.all([
    prisma.mediaFile.findMany({
      where,
      select: mediaListSelect,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.mediaFile.count({ where }),
  ]);

  const list: MediaFileListItem[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    source: row.source,
    category: row.category,
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    createdAt: row.createdAt,
    usageCount: row._count.coverUsages + row._count.contentUsages,
  }));

  return { list, total };
}

export async function getMediaFileUsage(id: string) {
  const file = await prisma.mediaFile.findFirst({
    where: { id, status: "ACTIVE" },
    select: {
      coverUsages: {
        select: {
          post: { select: { slug: true, title: true } },
        },
      },
      contentUsages: {
        select: {
          post: { select: { slug: true, title: true } },
        },
      },
    },
  });

  if (!file) return null;

  const postMap = new Map<string, { slug: string; title: string }>();
  for (const usage of file.coverUsages) {
    postMap.set(usage.post.slug, usage.post);
  }
  for (const usage of file.contentUsages) {
    postMap.set(usage.post.slug, usage.post);
  }

  const posts = [...postMap.values()];
  return {
    count: posts.length,
    posts,
  };
}

type DeleteMediaFileResult =
  | { ok: true }
  | { error: string; usageCount?: number };

const mediaReplaceSelect = {
  id: true,
  url: true,
  source: true,
  category: true,
  originalName: true,
  mimeType: true,
  size: true,
} satisfies Prisma.MediaFileSelect;

export type MediaReplaceResult = Prisma.MediaFileGetPayload<{
  select: typeof mediaReplaceSelect;
}>;

export async function replaceUploadedMediaFile(input: {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}): Promise<{ data: MediaReplaceResult } | { error: string }> {
  const file = await prisma.mediaFile.findFirst({
    where: { id: input.id, status: "ACTIVE" },
    select: {
      id: true,
      source: true,
      key: true,
    },
  });

  if (!file) return { error: "文件不存在或已删除" };
  if (file.source !== "UPLOAD") return { error: "仅支持站内上传文件替换" };
  if (!file.key) return { error: "文件存储信息缺失，无法替换" };

  await uploadImageToKey(input.buffer, {
    key: file.key,
    contentType: input.mimeType,
  });

  const data = await prisma.mediaFile.update({
    where: { id: input.id },
    data: {
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
    },
    select: mediaReplaceSelect,
  });

  return { data };
}

export async function deleteMediaFile(id: string): Promise<DeleteMediaFileResult> {
  const file = await prisma.mediaFile.findFirst({
    where: { id, status: "ACTIVE" },
    select: {
      id: true,
      source: true,
      key: true,
      _count: {
        select: {
          coverUsages: true,
          contentUsages: true,
        },
      },
    },
  });

  if (!file) {
    return { error: "文件不存在或已删除" as const };
  }

  const usageCount = file._count.coverUsages + file._count.contentUsages;
  if (usageCount > 0) {
    return { error: `该文件正在被 ${usageCount} 篇文章使用，无法删除` as const, usageCount };
  }

  await softDeleteMediaFile(id);

  if (file.source === "UPLOAD" && file.key) {
    try {
      await deleteObject(file.key);
    } catch (error) {
      console.error("删除 OSS 对象失败:", file.key, error);
    }
  }

  return { ok: true as const };
}

export const postCoverMediaInclude = {
  orderBy: { sortOrder: "asc" as const },
  include: {
    mediaFile: {
      select: {
        id: true,
        url: true,
        source: true,
      },
    },
  },
};

export const postContentMediaInclude = {
  include: {
    mediaFile: {
      select: {
        id: true,
        url: true,
      },
    },
  },
};

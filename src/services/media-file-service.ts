import { MediaCategory, MediaSource, Prisma } from "@/generated/prisma";
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

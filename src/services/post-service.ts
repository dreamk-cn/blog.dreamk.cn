import { Prisma } from "@prisma/client";
import { contentConfig } from "@/config/content";
import { prisma } from "@/libs/prisma";

type PostTagInput = { id?: string; name?: string; slug?: string };

function toTagConnectOrCreate(tags: PostTagInput[]): Prisma.TagCreateOrConnectWithoutPostsInput[] {
  return tags.map((tag) => {
    const normalizedSlug = (tag.slug || tag.name || "").toLowerCase().replace(/ /g, "-");
    const tagName = tag.name || normalizedSlug || "untitled-tag";

    return {
      where: tag.id ? { id: tag.id } : { slug: normalizedSlug },
      create: {
        name: tagName,
        slug: normalizedSlug || tagName,
      },
    };
  });
}

export async function getPostDetail(params: { id?: string; slug?: string; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; isAdmin: boolean }) {
  const { id, slug, status, isAdmin } = params;
  const queryKey = (id ? "id" : "slug") as "id" | "slug";
  const queryValue = (id || slug) as string;

  const query: Parameters<typeof prisma.post.findFirst>[0] = {
    where: {
      [queryKey]: queryValue,
      ...(!isAdmin
        ? { status: "PUBLISHED" }
        : status
          ? { status }
          : {}),
    },
    include: {
      tags: true,
      category: true,
    },
  };

  return prisma.post.findFirst(query);
}

export async function listPosts(params: {
  pageNo: number;
  pageSize: number;
  keyword?: string;
  sortBy: "createdAt" | "updatedAt" | "title" | "content";
  sortOrder: "asc" | "desc";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isAdmin: boolean;
}) {
  const { pageNo, pageSize, keyword, sortBy, sortOrder, status, isAdmin } = params;
  const query: Parameters<typeof prisma.post.findMany>[0] = {
    include: {
      category: true,
      tags: true,
    },
    where: {
      ...(!isAdmin
        ? { status: "PUBLISHED" }
        : status
          ? { status }
          : {}),
      ...(isAdmin
        ? {}
        : {
            slug: {
              notIn: [...contentConfig.excludedPostSlugsForPublicFeed],
            },
          }),
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (pageNo - 1) * pageSize,
    take: pageSize,
  };

  if (keyword) {
    query.where = {
      ...query.where,
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { content: { contains: keyword, mode: "insensitive" } },
      ],
    };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany(query),
    prisma.post.count({ where: query.where }),
  ]);
  return { posts, total };
}

export async function createPost(input: {
  userId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  coverUrl?: string;
  categoryId?: string;
  tags: PostTagInput[];
}) {
  const { userId, title, slug, content, excerpt, status, featured, coverUrl, categoryId, tags } = input;

  return prisma.post.create({
    data: {
      title,
      slug,
      status,
      content,
      excerpt,
      featured,
      coverUrl,
      user: { connect: { id: userId } },
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      ...(tags.length > 0 ? { tags: { connectOrCreate: toTagConnectOrCreate(tags) } } : {}),
    },
  });
}

export async function updatePost(input: {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  coverUrl?: string;
  categoryId?: string;
  tags: PostTagInput[];
}) {
  const { id, title, slug, content, excerpt, status, featured, coverUrl, categoryId, tags } = input;
  const existingPost = await prisma.post.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!existingPost) return null;

  return prisma.post.update({
    where: { id },
    data: {
      title,
      slug,
      content,
      excerpt,
      status,
      featured,
      coverUrl,
      categoryId,
      tags: {
        disconnect: existingPost.tags.map((tag) => ({ id: tag.id })),
        connectOrCreate: toTagConnectOrCreate(tags),
      },
    },
    include: {
      tags: true,
      category: true,
    },
  });
}

export async function deletePosts(ids: string[]) {
  return prisma.post.deleteMany({
    where: {
      id: { in: ids },
    },
  });
}

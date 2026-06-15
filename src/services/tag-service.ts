import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  PUBLIC_CACHE_TAGS,
  PUBLIC_CONTENT_REVALIDATE_SEC,
  cachePublicContent,
  publicTagCacheTag,
} from "@/lib/public-cache";
import { normalizeSlug } from "@/lib/slug";
import { decodeRouteSlug } from "@/lib/site-url";
import { resolveArchivePage, sortTaxonomyByPostCount } from "@/lib/taxonomy";
import { buildPublicPostWhere, postListInclude } from "@/services/post-service";

const publicPostWhere = buildPublicPostWhere();

async function queryTagsWithPublicPostCount() {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
      _count: {
        select: {
          posts: {
            where: publicPostWhere,
          },
        },
      },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    updatedAt: tag.updatedAt,
    postCount: tag._count.posts,
  }));
}

async function queryTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });
}

export async function listTags(keyword = "") {
  const query: Prisma.TagFindManyArgs = {
    orderBy: { createdAt: "desc" },
  };
  if (keyword) {
    query.where = {
      OR: [
        { name: { contains: keyword, mode: "insensitive" } },
        { slug: { contains: keyword, mode: "insensitive" } },
      ],
    };
  }
  return prisma.tag.findMany(query);
}

export async function createTag(input: { name: string; slug?: string }) {
  const normalizedSlug = normalizeSlug(input.slug || input.name, 50);
  const exists = await prisma.tag.findFirst({
    where: { OR: [{ name: input.name }, { slug: normalizedSlug }] },
  });
  if (exists) return { error: "标签已存在" as const };

  const data = await prisma.tag.create({ data: { name: input.name, slug: normalizedSlug } });
  return { data };
}

export async function updateTag(input: { id: string; name: string; slug?: string }) {
  const existing = await prisma.tag.findUnique({ where: { id: input.id } });
  if (!existing) return { error: "标签不存在" as const };

  const normalizedSlug = normalizeSlug(input.slug || input.name, 50);
  const exists = await prisma.tag.findFirst({
    where: {
      OR: [{ name: input.name }, { slug: normalizedSlug }],
      NOT: { id: input.id },
    },
  });
  if (exists) return { error: "标签名或Slug已被使用" as const };

  const data = await prisma.tag.update({
    where: { id: input.id },
    data: { name: input.name, slug: normalizedSlug },
  });
  return { data, previousSlug: existing.slug };
}

export async function deleteTag(id: string) {
  const exist = await prisma.tag.findUnique({ where: { id } });
  if (!exist) return { error: "标签不存在" as const };
  await prisma.tag.delete({ where: { id } });
  return { data: { slug: exist.slug } };
}

export function findTagBySlug(slug: string) {
  const routeSlug = decodeRouteSlug(slug);
  return cachePublicContent(
    () => queryTagBySlug(routeSlug),
    ["findTagBySlug", routeSlug],
    {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SEC,
      tags: [PUBLIC_CACHE_TAGS.tags, publicTagCacheTag(routeSlug)],
    },
  );
}

export function listPublicTags(limit?: number) {
  return cachePublicContent(
    async () => {
      const tags = sortTaxonomyByPostCount(await queryTagsWithPublicPostCount()).filter(
        (tag) => tag.postCount > 0,
      );
      return limit ? tags.slice(0, limit) : tags;
    },
    ["listPublicTags", limit ? String(limit) : "all"],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SEC, tags: [PUBLIC_CACHE_TAGS.tags, PUBLIC_CACHE_TAGS.posts] },
  );
}

export function listPublicTagsWithPostCount() {
  return cachePublicContent(
    async () => sortTaxonomyByPostCount(await queryTagsWithPublicPostCount()),
    ["listPublicTagsWithPostCount"],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SEC, tags: [PUBLIC_CACHE_TAGS.tags, PUBLIC_CACHE_TAGS.posts] },
  );
}

export function getPublicTagPostListPage(params: {
  slug: string;
  page: number;
  pageSize: number;
}) {
  const safePage = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const routeSlug = decodeRouteSlug(params.slug);

  return cachePublicContent(
    async () => {
      const tag = await queryTagBySlug(routeSlug);
      if (!tag) {
        return null;
      }

      const where = {
        ...publicPostWhere,
        tags: { some: { slug: routeSlug } },
      } satisfies Prisma.PostWhereInput;

      const total = await prisma.post.count({ where });
      const { totalPages, currentPage, skip } = resolveArchivePage({
        page: safePage,
        pageSize: params.pageSize,
        total,
      });

      const posts = await prisma.post.findMany({
        include: postListInclude,
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: params.pageSize,
      });

      return {
        tag,
        posts,
        total,
        totalPages,
        currentPage,
      };
    },
    ["getPublicTagPostListPage", routeSlug, String(safePage), String(params.pageSize)],
    {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SEC,
      tags: [PUBLIC_CACHE_TAGS.tags, PUBLIC_CACHE_TAGS.posts, publicTagCacheTag(routeSlug)],
    },
  );
}

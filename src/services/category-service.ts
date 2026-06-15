import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CACHE_TAGS, PUBLIC_CONTENT_REVALIDATE_SEC, cachePublicContent, publicCategoryCacheTag } from "@/lib/public-cache";
import { normalizeSlug } from "@/lib/slug";
import { decodeRouteSlug } from "@/lib/site-url";
import { resolveArchivePage, sortTaxonomyByPostCount } from "@/lib/taxonomy";
import { taxonomyConflictExists, taxonomyKeywordWhere } from "@/lib/taxonomy-helpers";
import { buildPublicPostWhere, postListInclude } from "@/services/post-service";

export async function listCategories(keyword = "") {
  const query: Prisma.CategoryFindManyArgs = {
    orderBy: { createdAt: "desc" },
  };
  if (keyword) {
    query.where = taxonomyKeywordWhere(keyword) as Prisma.CategoryFindManyArgs['where'];
  }
  return prisma.category.findMany(query);
}

export async function createCategory(input: { name: string; slug?: string }) {
  const normalizedSlug = normalizeSlug(input.slug || input.name, 100);
  const exists = await taxonomyConflictExists(prisma.category, input.name, normalizedSlug);
  if (exists) return { error: "分类已存在" as const };

  const data = await prisma.category.create({ data: { name: input.name, slug: normalizedSlug } });
  return { data };
}

export async function updateCategory(input: { id: string; name: string; slug?: string }) {
  const normalizedSlug = normalizeSlug(input.slug || input.name, 100);
  const exists = await taxonomyConflictExists(prisma.category, input.name, normalizedSlug, input.id);
  if (exists) return { error: "分类名或Slug已被使用" as const };

  const data = await prisma.category.update({
    where: { id: input.id },
    data: { name: input.name, slug: normalizedSlug },
  });
  return { data };
}

export async function deleteCategory(id: string) {
  const exist = await prisma.category.findUnique({ where: { id } });
  if (!exist) return { error: "分类不存在" as const };
  await prisma.category.delete({ where: { id } });
  return { data: null };
}

async function queryCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });
}

export function findCategoryBySlug(slug: string) {
  const routeSlug = decodeRouteSlug(slug);
  return cachePublicContent(
    () => queryCategoryBySlug(routeSlug),
    ["findCategoryBySlug", routeSlug],
    {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SEC,
      tags: [PUBLIC_CACHE_TAGS.categories, publicCategoryCacheTag(routeSlug)],
    },
  );
}

export function listPublicCategories(limit?: number) {
  return cachePublicContent(
    () =>
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        ...(limit ? { take: limit } : {}),
      }),
    ["listPublicCategories", limit ? String(limit) : "all"],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SEC, tags: [PUBLIC_CACHE_TAGS.categories] },
  );
}

export function listPublicCategoriesWithPostCount() {
  return cachePublicContent(
    async () => {
      const publicPostWhere = buildPublicPostWhere();
      const groupedPostCountsArgs = {
        by: ["categoryId"],
        where: {
          ...publicPostWhere,
          categoryId: {
            not: null,
          },
        },
        _count: {
          _all: true,
        },
      } satisfies Prisma.PostGroupByArgs;

      const [categories, groupedPostCounts] = await Promise.all([
        prisma.category.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
          },
        }),
        prisma.post.groupBy(groupedPostCountsArgs),
      ]);

      const postCountMap = new Map(
        groupedPostCounts
          .filter((item) => item.categoryId)
          .map((item) => [item.categoryId as string, item._count._all]),
      );

      return sortTaxonomyByPostCount(
        categories.map((category) => ({
          ...category,
          postCount: postCountMap.get(category.id) ?? 0,
        })),
      );
    },
    ["listPublicCategoriesWithPostCount"],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SEC, tags: [PUBLIC_CACHE_TAGS.categories, PUBLIC_CACHE_TAGS.posts] },
  );
}

export function getPublicCategoryPostListPage(params: {
  slug: string;
  page: number;
  pageSize: number;
}) {
  const routeSlug = decodeRouteSlug(params.slug);
  const safePage = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;

  return cachePublicContent(
    async () => {
      const category = await queryCategoryBySlug(routeSlug);
      if (!category) {
        return null;
      }

      const where = {
        ...buildPublicPostWhere(),
        categoryId: category.id,
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
        category,
        posts,
        total,
        totalPages,
        currentPage,
      };
    },
    ["getPublicCategoryPostListPage", routeSlug, String(safePage), String(params.pageSize)],
    {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SEC,
      tags: [PUBLIC_CACHE_TAGS.categories, PUBLIC_CACHE_TAGS.posts, publicCategoryCacheTag(routeSlug)],
    },
  );
}

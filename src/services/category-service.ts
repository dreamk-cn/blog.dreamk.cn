import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CACHE_TAGS, PUBLIC_CONTENT_REVALIDATE_SEC, cachePublicContent } from "@/lib/public-cache";
import { normalizeSlug } from "@/lib/slug";
import { buildPublicPostWhere, postListInclude } from "@/services/post-service";

export async function listCategories(keyword = "") {
  const query: Prisma.CategoryFindManyArgs = {
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
  return prisma.category.findMany(query);
}

export async function createCategory(input: { name: string; slug?: string }) {
  const normalizedSlug = normalizeSlug(input.slug || input.name, 100);
  const exists = await prisma.category.findFirst({
    where: { OR: [{ name: input.name }, { slug: normalizedSlug }] },
  });
  if (exists) return { error: "分类已存在" as const };

  const data = await prisma.category.create({ data: { name: input.name, slug: normalizedSlug } });
  return { data };
}

export async function updateCategory(input: { id: string; name: string; slug?: string }) {
  const normalizedSlug = normalizeSlug(input.slug || input.name, 100);
  const exists = await prisma.category.findFirst({
    where: {
      OR: [{ name: input.name }, { slug: normalizedSlug }],
      NOT: { id: input.id },
    },
  });
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
  return cachePublicContent(
    () => queryCategoryBySlug(slug),
    ["findCategoryBySlug", slug],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SEC, tags: [PUBLIC_CACHE_TAGS.categories, `public:category:${slug}`] },
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

      return categories
        .map((category) => ({
          ...category,
          postCount: postCountMap.get(category.id) ?? 0,
        }))
        .sort((a, b) => {
          if (b.postCount !== a.postCount) return b.postCount - a.postCount;
          return a.name.localeCompare(b.name, "zh-CN");
        });
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
  const safePage = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;

  return cachePublicContent(
    async () => {
      const category = await queryCategoryBySlug(params.slug);
      if (!category) {
        return null;
      }

      const where = {
        ...buildPublicPostWhere(),
        categoryId: category.id,
      } satisfies Prisma.PostWhereInput;

      const total = await prisma.post.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
      const currentPage = Math.min(safePage, totalPages);
      const skip = (currentPage - 1) * params.pageSize;

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
    ["getPublicCategoryPostListPage", params.slug, String(safePage), String(params.pageSize)],
    {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SEC,
      tags: [PUBLIC_CACHE_TAGS.categories, PUBLIC_CACHE_TAGS.posts, `public:category:${params.slug}`],
    },
  );
}

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slug";
import { buildPublicPostWhere } from "@/services/post-service";

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

export async function findCategoryBySlug(slug: string) {
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

export async function listPublicCategories(limit?: number) {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    ...(limit ? { take: limit } : {}),
  });
}

export async function listPublicCategoriesWithPostCount() {
  const publicPostWhere = buildPublicPostWhere();
  const [categories, groupedPostCounts] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.post.groupBy({
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
    }),
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
}

export async function getPublicCategoryPostListPage(params: {
  slug: string;
  page: number;
  pageSize: number;
}) {
  const category = await findCategoryBySlug(params.slug);
  if (!category) {
    return null;
  }

  const safePage = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const where = {
    ...buildPublicPostWhere(),
    categoryId: category.id,
  } satisfies Prisma.PostWhereInput;

  const total = await prisma.post.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const skip = (currentPage - 1) * params.pageSize;

  const posts = await prisma.post.findMany({
    include: {
      tags: true,
    },
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
}

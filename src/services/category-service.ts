import { Prisma } from "@prisma/client";
import { prisma } from "@/libs/prisma";

function normalizeSlug(name: string, slug?: string) {
  return (slug || name).toLowerCase().replace(/\s+/g, "-");
}

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
  const normalizedSlug = normalizeSlug(input.name, input.slug);
  const exists = await prisma.category.findFirst({
    where: { OR: [{ name: input.name }, { slug: normalizedSlug }] },
  });
  if (exists) return { error: "分类已存在" as const };

  const data = await prisma.category.create({ data: { name: input.name, slug: normalizedSlug } });
  return { data };
}

export async function updateCategory(input: { id: string; name: string; slug?: string }) {
  const normalizedSlug = normalizeSlug(input.name, input.slug);
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

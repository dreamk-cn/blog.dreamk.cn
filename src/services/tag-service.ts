import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slug";

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
  return { data };
}

export async function deleteTag(id: string) {
  const exist = await prisma.tag.findUnique({ where: { id } });
  if (!exist) return { error: "标签不存在" as const };
  await prisma.tag.delete({ where: { id } });
  return { data: null };
}

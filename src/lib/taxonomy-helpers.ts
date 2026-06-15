/**
 * 分类/标签服务共享工具。
 * 两者结构高度相似（各有 name / slug），此处抽取通用模式以减少重复。
 */

import type { PrismaClient } from '@/generated/prisma';

type TaxonomyDelegate = PrismaClient['category'] | PrismaClient['tag'];

/** Prisma delegate 上 findFirst 的最小接口签名，避免直接使用 Function 类型 */
interface TaxonomyFindFirst {
  findFirst(args: { where: Record<string, unknown> }): Promise<unknown>;
}

/** 构建 name + slug 关键词 OR 搜索条件 */
export function taxonomyKeywordWhere(keyword: string) {
  if (!keyword) return {};
  return {
    OR: [
      { name: { contains: keyword, mode: 'insensitive' as const } },
      { slug: { contains: keyword, mode: 'insensitive' as const } },
    ],
  };
}

/**
 * 检查 name / slug 是否已被占用。
 * 若传入 excludeId，则排除该 ID（用于更新场景）。
 */
export async function taxonomyConflictExists(
  delegate: TaxonomyDelegate,
  name: string,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const where: Record<string, unknown> = {
    OR: [{ name }, { slug }],
  };
  if (excludeId) {
    where.NOT = { id: excludeId };
  }
  const existing = await (delegate as unknown as TaxonomyFindFirst).findFirst({ where });
  return !!existing;
}

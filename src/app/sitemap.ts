import type { MetadataRoute } from "next";
import { contentConfig } from "@/config/content";
import { absoluteUrl } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

/** 与 `posts-list.tsx` 一致 */
const POST_LIST_PAGE_SIZE = 10;
/** 与 `category-post-list.tsx` 一致 */
const CATEGORY_PAGE_SIZE = 10;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicPostWhere = {
    status: "PUBLISHED" as const,
    slug: { notIn: [...contentConfig.excludedPostSlugsForPublicFeed] },
  };

  const [posts, postListTotal, categories, categoryCounts] = await Promise.all([
    prisma.post.findMany({
      where: publicPostWhere,
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.post.count({ where: publicPostWhere }),
    prisma.category.findMany({
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.post.groupBy({
      by: ["categoryId"],
      where: {
        ...publicPostWhere,
        categoryId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const countByCategoryId = new Map<string, number>();
  for (const row of categoryCounts) {
    if (row.categoryId) {
      countByCategoryId.set(row.categoryId, row._count._all);
    }
  }

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/posts"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(`/posts/${encodeURIComponent(p.slug)}`),
    lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const postListTotalPages = Math.max(1, Math.ceil(postListTotal / POST_LIST_PAGE_SIZE));
  const postListPages: MetadataRoute.Sitemap = [];
  for (let page = 2; page <= postListTotalPages; page++) {
    postListPages.push({
      url: absoluteUrl(`/posts/page/${page}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.65,
    });
  }

  const categoryEntries: MetadataRoute.Sitemap = [];
  for (const cat of categories) {
    const total = countByCategoryId.get(cat.id) ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));

    categoryEntries.push({
      url: absoluteUrl(`/categories/${encodeURIComponent(cat.slug)}`),
      lastModified: cat.updatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
    });

    for (let page = 2; page <= totalPages; page++) {
      categoryEntries.push({
        url: absoluteUrl(`/categories/${encodeURIComponent(cat.slug)}/page/${page}`),
        lastModified: cat.updatedAt,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  return [...staticRoutes, ...postEntries, ...postListPages, ...categoryEntries];
}

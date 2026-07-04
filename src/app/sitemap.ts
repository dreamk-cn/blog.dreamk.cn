import type { MetadataRoute } from "next";
import { contentConfig } from "@/config/content";
import { PUBLIC_CACHE_TAGS, PUBLIC_CONTENT_REVALIDATE_SEC, cachePublicContent } from "@/lib/public-cache";
import { ARCHIVE_PAGE_SIZE } from "@/lib/taxonomy";
import { absoluteUrl, categoryPagePath, categoryPath, postAbsoluteUrl, tagPath } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** 与 `posts-list.tsx` 一致 */
const POST_LIST_PAGE_SIZE = 10;
/** 与归档列表页一致 */
const ARCHIVE_LIST_PAGE_SIZE = ARCHIVE_PAGE_SIZE;

function pickLatestDate(...dates: Array<Date | null | undefined>) {
  return dates.filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0];
}

async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const publicPostWhere = {
    status: "PUBLISHED" as const,
    slug: { notIn: [...contentConfig.excludedPostSlugsForPublicFeed] },
  };

  const [posts, postListTotal, categories, categoryCounts, tags, latestPublicPost, aboutPage, latestFriendLink] =
    await Promise.all([
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
    prisma.tag.findMany({
      select: {
        slug: true,
        updatedAt: true,
        _count: {
          select: {
            posts: { where: publicPostWhere },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.post.findFirst({
      where: publicPostWhere,
      select: { updatedAt: true, publishedAt: true, createdAt: true },
      orderBy: [{ updatedAt: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.post.findFirst({
      where: {
        status: "PUBLISHED",
        slug: contentConfig.pageSlugs.about,
      },
      select: { updatedAt: true, publishedAt: true, createdAt: true },
    }),
    prisma.friendLink.findFirst({
      where: { status: "APPROVED" },
      select: { updatedAt: true },
      orderBy: [{ sortOrder: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  const countByCategoryId = new Map<string, number>();
  for (const row of categoryCounts) {
    if (row.categoryId) {
      countByCategoryId.set(row.categoryId, row._count._all);
    }
  }

  const latestPostModified = pickLatestDate(
    latestPublicPost?.updatedAt,
    latestPublicPost?.publishedAt,
    latestPublicPost?.createdAt,
  );
  const latestCategoryModified = pickLatestDate(...categories.map((category) => category.updatedAt));
  const latestTagModified = pickLatestDate(...tags.map((tag) => tag.updatedAt));
  const aboutPageModified = pickLatestDate(aboutPage?.updatedAt, aboutPage?.publishedAt, aboutPage?.createdAt);
  const latestFriendLinkModified = latestFriendLink?.updatedAt;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latestPostModified, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/posts"), lastModified: latestPostModified, changeFrequency: "daily", priority: 0.9 },
    {
      url: absoluteUrl("/categories"),
      lastModified: latestCategoryModified ?? latestPostModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/tags"),
      lastModified: latestTagModified ?? latestPostModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/links"),
      lastModified: latestFriendLinkModified ?? latestPostModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...(aboutPageModified
      ? [
          {
            url: absoluteUrl("/about"),
            lastModified: aboutPageModified,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          },
        ]
      : []),
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: postAbsoluteUrl(p.slug),
    lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const postListTotalPages = Math.max(1, Math.ceil(postListTotal / POST_LIST_PAGE_SIZE));
  const postListPages: MetadataRoute.Sitemap = [];
  for (let page = 2; page <= postListTotalPages; page++) {
    postListPages.push({
      url: absoluteUrl(`/posts/page/${page}`),
      lastModified: latestPostModified,
      changeFrequency: "daily",
      priority: 0.65,
    });
  }

  const categoryEntries: MetadataRoute.Sitemap = [];
  for (const cat of categories) {
    const total = countByCategoryId.get(cat.id) ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_LIST_PAGE_SIZE));

    categoryEntries.push({
      url: absoluteUrl(categoryPath(cat.slug)),
      lastModified: cat.updatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
    });

    for (let page = 2; page <= totalPages; page++) {
      categoryEntries.push({
        url: absoluteUrl(categoryPagePath(cat.slug, page)),
        lastModified: cat.updatedAt,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  const tagEntries: MetadataRoute.Sitemap = tags
    .filter((tag) => tag._count.posts > 0)
    .map((tag) => ({
      url: absoluteUrl(tagPath(tag.slug)),
      lastModified: tag.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  return [...staticRoutes, ...postEntries, ...postListPages, ...categoryEntries, ...tagEntries];
}

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return cachePublicContent(buildSitemapEntries, ["sitemap"], {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SEC,
    tags: [
      PUBLIC_CACHE_TAGS.sitemap,
      PUBLIC_CACHE_TAGS.posts,
      PUBLIC_CACHE_TAGS.categories,
      PUBLIC_CACHE_TAGS.tags,
      PUBLIC_CACHE_TAGS.friendLinks,
    ],
  });
}

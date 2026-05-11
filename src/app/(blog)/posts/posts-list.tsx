import NextLink from "next/link";
import { PostCard } from "@/components/post/post-card";
import { ClientCard, ClientCardBody } from "@/components/ui/heroui-client";
import { contentConfig } from "@/config/content";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

function buildPageHref(page: number, keyword?: string) {
  const query = new URLSearchParams();
  if (keyword) {
    query.set("keyword", keyword);
  }

  if (page <= 1) return `/posts${query.toString() ? `?${query.toString()}` : ""}`;
  const pagePath = `/posts/page/${page}`;
  return `${pagePath}${query.toString() ? `?${query.toString()}` : ""}`;
}

function buildPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export async function renderPostsListPage(requestedPage: number, keyword?: string) {
  const safePage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const normalizedKeyword = keyword?.trim() ?? "";

  const baseWhere = {
    status: "PUBLISHED" as const,
    slug: {
      notIn: [...contentConfig.excludedPostSlugsForPublicFeed],
    },
    ...(normalizedKeyword
      ? {
          OR: [
            {
              title: {
                contains: normalizedKeyword,
                mode: "insensitive" as const,
              },
            },
            {
              excerpt: {
                contains: normalizedKeyword,
                mode: "insensitive" as const,
              },
            },
            {
              content: {
                contains: normalizedKeyword,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.post.count({ where: baseWhere });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(safePage, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const posts = await prisma.post.findMany({
    include: {
      tags: true,
    },
    where: baseWhere,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip,
    take: PAGE_SIZE,
  });

  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-base">文章列表</h1>
        {normalizedKeyword && (
          <p className="text-sm text-text-muted">
            搜索关键词：<span className="font-medium text-text-base">{normalizedKeyword}</span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <ClientCard className="shadow-sm">
            <ClientCardBody className="py-10 text-center text-text-muted">还没有发布文章</ClientCardBody>
          </ClientCard>
        )}

        <nav aria-label="文章分页导航" className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {hasPrev ? (
            <NextLink
              href={buildPageHref(currentPage - 1, normalizedKeyword)}
              rel="prev"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-base transition-colors hover:border-primary hover:text-primary"
            >
              上一页
            </NextLink>
          ) : (
            <span className="cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-sm text-text-sub opacity-60">
              上一页
            </span>
          )}

          {pageNumbers.map((page, index) => {
            const prevPage = pageNumbers[index - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <div key={page} className="flex items-center gap-2">
                {showEllipsis && <span className="px-1 text-text-sub">...</span>}
                <NextLink
                  href={buildPageHref(page, normalizedKeyword)}
                  aria-current={page === currentPage ? "page" : undefined}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    page === currentPage
                      ? "border-primary bg-primary text-white"
                      : "border-border text-text-base hover:border-primary hover:text-primary"
                  }`}
                >
                  {page}
                </NextLink>
              </div>
            );
          })}

          {hasNext ? (
            <NextLink
              href={buildPageHref(currentPage + 1, normalizedKeyword)}
              rel="next"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-base transition-colors hover:border-primary hover:text-primary"
            >
              下一页
            </NextLink>
          ) : (
            <span className="cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-sm text-text-sub opacity-60">
              下一页
            </span>
          )}

          <span className="ml-auto text-sm text-text-muted">
            第 {currentPage} / {totalPages} 页，共 {total} 篇
          </span>
        </nav>
      </main>
    </div>
  );
}

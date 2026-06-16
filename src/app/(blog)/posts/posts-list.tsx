import { AppLink } from "@/components/ui/app-link";
import { PostCard } from "@/components/post/post-card";
import { ClientCard, ClientCardBody } from "@/components/ui/heroui-client";
import { buildPageNumbers } from "@/lib/pagination";
import { listPublicPostsPage } from "@/services/post-service";

const PAGE_SIZE = 10;

function buildPageHref(page: number, keyword?: string) {
  const query = new URLSearchParams();
  if (keyword) {
    query.set("keyword", keyword);
  }

  if (page <= 1)
    return `/posts${query.toString() ? `?${query.toString()}` : ""}`;
  const pagePath = `/posts/page/${page}`;
  return `${pagePath}${query.toString() ? `?${query.toString()}` : ""}`;
}

export async function renderPostsListPage(
  requestedPage: number,
  keyword?: string,
) {
  const normalizedKeyword = keyword?.trim() ?? "";
  const { posts, total, totalPages, currentPage } = await listPublicPostsPage({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    keyword: normalizedKeyword,
  });

  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-base">
          文章列表
        </h1>
        {normalizedKeyword && (
          <p className="text-sm text-text-muted">
            搜索关键词：
            <span className="font-medium text-text-base">
              {normalizedKeyword}
            </span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <ClientCard className="shadow-sm">
            <ClientCardBody className="py-10 text-center text-text-muted">
              还没有发布文章
            </ClientCardBody>
          </ClientCard>
        )}

        <nav
          aria-label="文章分页导航"
          className="flex flex-wrap items-center gap-2 border-t border-border pt-4"
        >
          {hasPrev ? (
            <AppLink
              href={buildPageHref(currentPage - 1, normalizedKeyword)}
              rel="prev"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-base transition-colors hover:border-primary hover:text-primary"
            >
              上一页
            </AppLink>
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
                {showEllipsis && (
                  <span className="px-1 text-text-sub">...</span>
                )}
                <AppLink
                  href={buildPageHref(page, normalizedKeyword)}
                  aria-current={page === currentPage ? "page" : undefined}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    page === currentPage
                      ? "border-primary bg-primary text-white"
                      : "border-border text-text-base hover:border-primary hover:text-primary"
                  }`}
                >
                  {page}
                </AppLink>
              </div>
            );
          })}

          {hasNext ? (
            <AppLink
              href={buildPageHref(currentPage + 1, normalizedKeyword)}
              rel="next"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-base transition-colors hover:border-primary hover:text-primary"
            >
              下一页
            </AppLink>
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

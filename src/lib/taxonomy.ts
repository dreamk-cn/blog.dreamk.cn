/** 分类/标签等归档维度的通用工具 */

export function sortTaxonomyByPostCount<T extends { name: string; postCount: number }>(items: T[]) {
  return items.sort((a, b) => {
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

export function resolveArchivePage(params: { page: number; pageSize: number; total: number }) {
  const safePage = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const totalPages = Math.max(1, Math.ceil(params.total / params.pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const skip = (currentPage - 1) * params.pageSize;

  return { safePage, totalPages, currentPage, skip };
}

export const ARCHIVE_PAGE_SIZE = 10;

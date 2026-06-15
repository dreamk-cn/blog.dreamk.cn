import { notFound } from "next/navigation";
import { ArchivePostList } from "@/components/post/archive-post-list";
import { ARCHIVE_PAGE_SIZE } from "@/lib/taxonomy";
import { getTaxonomyCopy } from "@/lib/taxonomy-metadata";
import { categoryPagePath } from "@/lib/site-url";import { getPublicCategoryPostListPage } from "@/services/category-service";

export async function renderCategoryPostListPage(slug: string, requestedPage: number) {
  const pageData = await getPublicCategoryPostListPage({
    slug,
    page: requestedPage,
    pageSize: ARCHIVE_PAGE_SIZE,
  });
  if (!pageData) {
    notFound();
  }

  const { category, posts, total, totalPages, currentPage } = pageData;
  const copy = getTaxonomyCopy("category");
  const listPath = categoryPagePath(category.slug, currentPage);

  return (
    <ArchivePostList
      title={category.name}
      total={total}
      posts={posts}
      emptyMessage={copy.emptyArchive}
      paginationAriaLabel={copy.paginationAriaLabel}
      currentPage={currentPage}
      totalPages={totalPages}
      buildPageHref={(page) => categoryPagePath(category.slug, page)}
      seo={{
        breadcrumbItems: [
          { name: "首页", path: "/" },
          { name: copy.label, path: "/categories" },
          { name: category.name, path: listPath },
        ],
        collectionDescription: copy.browse(category.name),
        listPath,
      }}
    />
  );
}

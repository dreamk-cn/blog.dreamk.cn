import { notFound } from "next/navigation";
import { ArchivePostList } from "@/components/post/archive-post-list";
import { ARCHIVE_PAGE_SIZE } from "@/lib/taxonomy";
import { getTaxonomyCopy } from "@/lib/taxonomy-metadata";
import { tagPagePath } from "@/lib/site-url";
import { getPublicTagPostListPage } from "@/services/tag-service";

export async function renderTagPostListPage(
  slug: string,
  requestedPage: number,
) {
  const pageData = await getPublicTagPostListPage({
    slug,
    page: requestedPage,
    pageSize: ARCHIVE_PAGE_SIZE,
  });
  if (!pageData) {
    notFound();
  }

  const { tag, posts, total, totalPages, currentPage } = pageData;
  const copy = getTaxonomyCopy("tag");
  const listPath = tagPagePath(tag.slug, currentPage);

  return (
    <ArchivePostList
      title={tag.name}
      total={total}
      posts={posts}
      emptyMessage={copy.emptyArchive}
      paginationAriaLabel={copy.paginationAriaLabel}
      currentPage={currentPage}
      totalPages={totalPages}
      buildPageHref={(page) => tagPagePath(tag.slug, page)}
      seo={{
        breadcrumbItems: [
          { name: "首页", path: "/" },
          { name: copy.label, path: "/tags" },
          { name: tag.name, path: listPath },
        ],
        collectionDescription: copy.browse(tag.name),
        listPath,
      }}
    />
  );
}

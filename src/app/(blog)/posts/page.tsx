import { redirect } from "next/navigation";
import { renderPostsListPage } from "./posts-list";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
  }>;
};

export default async function Posts({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const pageFromQuery = Number(resolvedSearchParams.page);
  const keyword = resolvedSearchParams.keyword?.trim() ?? "";

  if (resolvedSearchParams.page && Number.isFinite(pageFromQuery) && pageFromQuery > 1) {
    const pagePath = `/posts/page/${Math.floor(pageFromQuery)}`;
    const params = new URLSearchParams();
    if (keyword) {
      params.set("keyword", keyword);
    }
    redirect(`${pagePath}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return renderPostsListPage(1, keyword);
}
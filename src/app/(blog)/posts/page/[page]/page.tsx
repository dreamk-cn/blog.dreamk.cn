import { notFound, redirect } from "next/navigation";
import { renderPostsListPage } from "../../posts-list";

type PageProps = {
  params: Promise<{
    page: string;
  }>;
  searchParams: Promise<{
    keyword?: string;
  }>;
};

export default async function PostsPaged({ params, searchParams }: PageProps) {
  const { page } = await params;
  const resolvedSearchParams = await searchParams;
  const keyword = resolvedSearchParams.keyword?.trim() ?? "";
  const pageNo = Number(page);

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    notFound();
  }

  if (pageNo === 1) {
    const query = new URLSearchParams();
    if (keyword) {
      query.set("keyword", keyword);
    }
    redirect(`/posts${query.toString() ? `?${query.toString()}` : ""}`);
  }

  return renderPostsListPage(pageNo, keyword);
}

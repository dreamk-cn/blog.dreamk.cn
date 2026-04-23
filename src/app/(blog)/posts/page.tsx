import { redirect } from "next/navigation";
import { renderPostsListPage } from "./posts-list";

type PageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function Posts({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const pageFromQuery = Number(resolvedSearchParams.page);

  if (resolvedSearchParams.page && Number.isFinite(pageFromQuery) && pageFromQuery > 1) {
    redirect(`/posts/page/${Math.floor(pageFromQuery)}`);
  }

  return renderPostsListPage(1);
}
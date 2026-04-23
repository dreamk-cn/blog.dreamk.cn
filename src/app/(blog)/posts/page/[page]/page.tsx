import { notFound, redirect } from "next/navigation";
import { renderPostsListPage } from "../../posts-list";

type PageProps = {
  params: Promise<{
    page: string;
  }>;
};

export default async function PostsPaged({ params }: PageProps) {
  const { page } = await params;
  const pageNo = Number(page);

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    notFound();
  }

  if (pageNo === 1) {
    redirect("/posts");
  }

  return renderPostsListPage(pageNo);
}

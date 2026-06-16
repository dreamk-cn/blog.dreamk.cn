import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  buildCanonical,
  buildNoIndexRobots,
  normalizeMetaDescription,
} from "@/lib/seo";
import { renderPostsListPage } from "../../posts-list";

type PageProps = {
  params: Promise<{
    page: string;
  }>;
  searchParams: Promise<{
    keyword?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const [{ page }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const keyword = resolvedSearchParams.keyword?.trim() ?? "";
  const pageNo = Number(page);
  const safePageNo = Number.isInteger(pageNo) && pageNo > 1 ? pageNo : 2;

  if (keyword) {
    const query = new URLSearchParams();
    query.set("keyword", keyword);

    return {
      title: `搜索：${keyword} - 第 ${safePageNo} 页`,
      description: normalizeMetaDescription(
        `站内搜索“${keyword}”的文章结果第 ${safePageNo} 页。`,
      ),
      alternates: buildCanonical(
        `/posts/page/${safePageNo}?${query.toString()}`,
      ),
      robots: buildNoIndexRobots({ follow: true }),
    };
  }

  return {
    title: `文章列表 - 第 ${safePageNo} 页`,
    description: `浏览 Dreamk 博客文章列表第 ${safePageNo} 页。`,
    alternates: buildCanonical(`/posts/page/${safePageNo}`),
  };
}

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

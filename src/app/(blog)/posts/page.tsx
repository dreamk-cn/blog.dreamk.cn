import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildCanonical, buildNoIndexRobots, normalizeMetaDescription } from "@/lib/seo";
import { renderPostsListPage } from "./posts-list";

export const revalidate = 300;

type PageProps = {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
  }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const keyword = resolvedSearchParams.keyword?.trim() ?? "";

  if (keyword) {
    return {
      title: `搜索：${keyword}`,
      description: normalizeMetaDescription(`站内搜索“${keyword}”的文章结果页。`),
      alternates: buildCanonical(`/posts?keyword=${encodeURIComponent(keyword)}`),
      robots: buildNoIndexRobots({ follow: true }),
    };
  }

  return {
    title: "文章列表",
    description: "浏览 Dreamk 博客的全部文章，按发布时间持续更新。",
    alternates: buildCanonical("/posts"),
  };
}

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
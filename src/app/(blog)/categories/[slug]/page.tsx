import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { findCategoryBySlug, renderCategoryPostListPage } from "./category-post-list";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategoryBySlug(slug);

  if (!category) {
    return {
      title: "分类不存在",
      description: "该分类可能已被删除或不存在",
    };
  }

  return {
    title: `${category.name} 分类`,
    description: `浏览 ${category.name} 分类下的文章`,
  };
}

export default async function CategoryDetail({ params, searchParams }: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const pageFromQuery = Number(resolvedSearchParams.page);

  if (resolvedSearchParams.page && Number.isFinite(pageFromQuery) && pageFromQuery > 1) {
    redirect(`/categories/${slug}/page/${Math.floor(pageFromQuery)}`);
  }

  return renderCategoryPostListPage(slug, 1);
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { findCategoryBySlug, renderCategoryPostListPage } from "../../category-post-list";

export const revalidate = 300;

type PageProps = {
  params: Promise<{
    slug: string;
    page: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, page } = await params;
  const pageNo = Number(page);
  const category = await findCategoryBySlug(slug);

  if (!category) {
    return {
      title: "分类不存在",
      description: "该分类可能已被删除或不存在",
    };
  }

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    return {
      title: `${category.name} 分类`,
      description: `浏览 ${category.name} 分类下的文章`,
    };
  }

  return {
    title: `${category.name} 分类 - 第 ${pageNo} 页`,
    description: `浏览 ${category.name} 分类文章第 ${pageNo} 页`,
  };
}

export default async function CategoryDetailPaged({ params }: PageProps) {
  const { slug, page } = await params;
  const pageNo = Number(page);

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    notFound();
  }

  if (pageNo === 1) {
    redirect(`/categories/${slug}`);
  }

  return renderCategoryPostListPage(slug, pageNo);
}

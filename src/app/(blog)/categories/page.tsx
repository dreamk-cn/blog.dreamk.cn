import type { Metadata } from "next";
import { TaxonomyIndexGrid } from "@/components/post/taxonomy-index-grid";
import { siteConfig } from "@/config/site";
import { buildCanonical, buildIndexRobots } from "@/lib/seo";
import { getTaxonomyCopy } from "@/lib/taxonomy-metadata";
import { categoryPath } from "@/lib/site-url";
import { listPublicCategoriesWithPostCount } from "@/services/category-service";

const copy = getTaxonomyCopy("category");

export const metadata: Metadata = {
  title: copy.label,
  description: `浏览 ${siteConfig.name} 博客的全部分类，按主题快速找到相关文章。`,
  alternates: buildCanonical("/categories"),
  robots: buildIndexRobots(),
};

export default async function Categories() {
  const list = await listPublicCategoriesWithPostCount();

  return (
    <TaxonomyIndexGrid
      title={copy.label}
      description="按主题浏览文章，点击分类查看完整列表。"
      items={list}
      emptyMessage={copy.emptyIndex}
      buildItemHref={categoryPath}
    />
  );
}

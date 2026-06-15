import type { Metadata } from "next";
import { TaxonomyIndexGrid } from "@/components/post/taxonomy-index-grid";
import { buildCanonical, buildIndexRobots } from "@/lib/seo";
import { getTaxonomyCopy } from "@/lib/taxonomy-metadata";
import { tagPath } from "@/lib/site-url";
import { listPublicTagsWithPostCount } from "@/services/tag-service";

const copy = getTaxonomyCopy("tag");

export const metadata: Metadata = {
  title: copy.label,
  description: "浏览 Dreamk 博客的全部标签，按主题快速找到相关文章。",
  alternates: buildCanonical("/tags"),
  robots: buildIndexRobots(),
};

export default async function TagsPage() {
  const list = await listPublicTagsWithPostCount();

  return (
    <TaxonomyIndexGrid
      title={copy.label}
      description="按主题浏览文章，点击标签查看完整列表。"
      items={list}
      emptyMessage={copy.emptyIndex}
      buildItemHref={tagPath}
    />
  );
}

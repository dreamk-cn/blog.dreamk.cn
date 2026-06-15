import type { Metadata } from "next";
import { buildCanonical, buildIndexRobots, buildNoIndexRobots } from "@/lib/seo";

export type TaxonomyKind = "category" | "tag";

const TAXONOMY_COPY = {
  category: {
    label: "分类",
    notFoundTitle: "分类不存在",
    notFoundDescription: "该分类可能已被删除或不存在",
    browse: (name: string) => `浏览 ${name} 分类下的文章`,
    browsePage: (name: string, page: number) => `浏览 ${name} 分类文章第 ${page} 页`,
    emptyArchive: "该分类下还没有发布文章",
    emptyIndex: "还没有可展示的分类",
    paginationAriaLabel: "分类文章分页导航",
  },
  tag: {
    label: "标签",
    notFoundTitle: "标签不存在",
    notFoundDescription: "该标签可能已被删除或不存在",
    browse: (name: string) => `浏览「${name}」标签下的文章`,
    browsePage: (name: string, page: number) => `浏览「${name}」标签文章第 ${page} 页`,
    emptyArchive: "该标签下还没有发布文章",
    emptyIndex: "还没有可展示的标签",
    paginationAriaLabel: "标签文章分页导航",
  },
} as const;

export function getTaxonomyCopy(kind: TaxonomyKind) {
  return TAXONOMY_COPY[kind];
}

export function buildTaxonomyNotFoundMetadata(
  kind: TaxonomyKind,
  canonicalPath: string,
): Metadata {
  const copy = getTaxonomyCopy(kind);
  return {
    title: copy.notFoundTitle,
    description: copy.notFoundDescription,
    alternates: buildCanonical(canonicalPath),
  };
}

export function buildTaxonomyDetailMetadata(
  kind: TaxonomyKind,
  entity: { name: string; slug: string },
  buildCanonicalPath: (slug: string) => string,
): Metadata {
  const copy = getTaxonomyCopy(kind);
  return {
    title: `${entity.name} ${copy.label}`,
    description: copy.browse(entity.name),
    alternates: buildCanonical(buildCanonicalPath(entity.slug)),
    robots: buildIndexRobots(),
  };
}

export function buildTaxonomyPagedMetadata(
  kind: TaxonomyKind,
  entity: { name: string; slug: string },
  pageNo: number,
  buildCanonicalPath: (slug: string, page: number) => string,
): Metadata {
  const copy = getTaxonomyCopy(kind);
  return {
    title: `${entity.name} ${copy.label} - 第 ${pageNo} 页`,
    description: copy.browsePage(entity.name, pageNo),
    alternates: buildCanonical(buildCanonicalPath(entity.slug, pageNo)),
    robots: buildNoIndexRobots({ follow: true }),
  };
}

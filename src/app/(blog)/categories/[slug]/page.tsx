import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildTaxonomyDetailMetadata,
  buildTaxonomyNotFoundMetadata,
} from "@/lib/taxonomy-metadata";
import { categoryPagePath, categoryPath } from "@/lib/site-url";
import { renderCategoryPostListPage } from "./category-post-list";
import { findCategoryBySlug } from "@/services/category-service";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategoryBySlug(slug);

  if (!category) {
    return buildTaxonomyNotFoundMetadata("category", categoryPath(slug));
  }

  return buildTaxonomyDetailMetadata("category", category, categoryPath);
}

export default async function CategoryDetail({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const pageFromQuery = Number(resolvedSearchParams.page);

  if (
    resolvedSearchParams.page &&
    Number.isFinite(pageFromQuery) &&
    pageFromQuery > 1
  ) {
    redirect(categoryPagePath(slug, Math.floor(pageFromQuery)));
  }

  return renderCategoryPostListPage(slug, 1);
}

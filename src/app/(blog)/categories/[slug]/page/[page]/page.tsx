import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  buildTaxonomyDetailMetadata,
  buildTaxonomyNotFoundMetadata,
  buildTaxonomyPagedMetadata,
} from "@/lib/taxonomy-metadata";
import { categoryPagePath, categoryPath } from "@/lib/site-url";
import { renderCategoryPostListPage } from "../../category-post-list";
import { findCategoryBySlug } from "@/services/category-service";

type PageProps = {
  params: Promise<{
    slug: string;
    page: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, page } = await params;
  const pageNo = Number(page);
  const category = await findCategoryBySlug(slug);

  if (!category) {
    return buildTaxonomyNotFoundMetadata(
      "category",
      categoryPagePath(
        slug,
        Number.isInteger(pageNo) && pageNo > 0 ? pageNo : 1,
      ),
    );
  }

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    return buildTaxonomyDetailMetadata("category", category, categoryPath);
  }

  return buildTaxonomyPagedMetadata(
    "category",
    category,
    pageNo,
    categoryPagePath,
  );
}

export default async function CategoryDetailPaged({ params }: PageProps) {
  const { slug, page } = await params;
  const pageNo = Number(page);

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    notFound();
  }

  if (pageNo === 1) {
    redirect(categoryPath(slug));
  }

  return renderCategoryPostListPage(slug, pageNo);
}

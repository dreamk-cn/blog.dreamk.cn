import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildTaxonomyDetailMetadata,
  buildTaxonomyNotFoundMetadata,
} from "@/lib/taxonomy-metadata";
import { tagPagePath, tagPath } from "@/lib/site-url";
import { renderTagPostListPage } from "./tag-post-list";
import { findTagBySlug } from "@/services/tag-service";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await findTagBySlug(slug);

  if (!tag) {
    return buildTaxonomyNotFoundMetadata("tag", tagPath(slug));
  }

  return buildTaxonomyDetailMetadata("tag", tag, tagPath);
}

export default async function TagDetail({ params, searchParams }: PageProps) {
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
    redirect(tagPagePath(slug, Math.floor(pageFromQuery)));
  }

  return renderTagPostListPage(slug, 1);
}

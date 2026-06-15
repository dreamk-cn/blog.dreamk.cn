import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  buildTaxonomyDetailMetadata,
  buildTaxonomyNotFoundMetadata,
  buildTaxonomyPagedMetadata,
} from "@/lib/taxonomy-metadata";
import { tagPagePath, tagPath } from "@/lib/site-url";
import { renderTagPostListPage } from "../../tag-post-list";
import { findTagBySlug } from "@/services/tag-service";

type PageProps = {
  params: Promise<{
    slug: string;
    page: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, page } = await params;
  const pageNo = Number(page);
  const tag = await findTagBySlug(slug);

  if (!tag) {
    return buildTaxonomyNotFoundMetadata(
      "tag",
      tagPagePath(slug, Number.isInteger(pageNo) && pageNo > 0 ? pageNo : 1),
    );
  }

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    return buildTaxonomyDetailMetadata("tag", tag, tagPath);
  }

  return buildTaxonomyPagedMetadata("tag", tag, pageNo, tagPagePath);
}

export default async function TagDetailPaged({ params }: PageProps) {
  const { slug, page } = await params;
  const pageNo = Number(page);

  if (!Number.isInteger(pageNo) || pageNo < 1) {
    notFound();
  }

  if (pageNo === 1) {
    redirect(tagPath(slug));
  }

  return renderTagPostListPage(slug, pageNo);
}

import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";

type JsonLd = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  path: string;
};

type ArticleJsonLdInput = {
  title: string;
  description: string;
  path: string;
  authorName: string;
  publishedAt: Date;
  modifiedAt: Date;
  categoryName?: string | null;
  coverUrls?: string[];
  tags?: string[];
};

function toAbsoluteUrl(urlOrPath: string) {
  return /^https?:\/\//.test(urlOrPath) ? urlOrPath : absoluteUrl(urlOrPath);
}

export function getMetadataBase() {
  return new URL(getSiteOrigin());
}

export function buildCanonical(urlOrPath: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: toAbsoluteUrl(urlOrPath),
  };
}

export function buildIndexRobots(): NonNullable<Metadata["robots"]> {
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  };
}

export function buildNoIndexRobots(options?: { follow?: boolean }): NonNullable<Metadata["robots"]> {
  const follow = options?.follow ?? false;
  return {
    index: false,
    follow,
    googleBot: {
      index: false,
      follow,
    },
  };
}

export function normalizeMetaDescription(text: string, maxLength = 160) {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function stringifyJsonLd(value: JsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: getSiteOrigin(),
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/posts")}?keyword={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildArticleJsonLd(input: ArticleJsonLdInput): JsonLd {
  const keywords = input.tags?.filter(Boolean) ?? [];

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    author: {
      "@type": "Person",
      name: input.authorName,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.name,
    },
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path),
    datePublished: input.publishedAt.toISOString(),
    dateModified: input.modifiedAt.toISOString(),
    inLanguage: "zh-CN",
    ...(input.categoryName ? { articleSection: input.categoryName } : {}),
    ...(keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    ...(input.coverUrls && input.coverUrls.length > 0
      ? { image: input.coverUrls.map((url) => toAbsoluteUrl(url)) }
      : {}),
  };
}

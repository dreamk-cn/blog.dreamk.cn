import { getPublicSiteOrigin } from "@/config/env.public";

type TaxonomySegment = "categories" | "tags";

/** 对外站点根地址，无末尾斜杠（与 NEXT_PUBLIC_BASE_URL 一致） */
export function getSiteOrigin(): string {
  return getPublicSiteOrigin();
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

/** 已是绝对地址则原样返回，否则拼接站点根地址 */
export function resolveAbsoluteUrl(urlOrPath: string): string {
  return /^https?:\/\//.test(urlOrPath) ? urlOrPath : absoluteUrl(urlOrPath);
}

export function postPath(slug: string): string {
  return `/posts/${encodeURIComponent(slug)}`;
}

export function postAbsoluteUrl(slug: string): string {
  return absoluteUrl(postPath(slug));
}

/** 路由动态段统一解码，避免中文 slug 在编码/未编码间切换导致查库失败 */
export function decodeRouteSlug(slug: string): string {
  if (!slug) return slug;
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function taxonomyPath(segment: TaxonomySegment, slug: string): string {
  return `/${segment}/${encodeURIComponent(slug)}`;
}

function taxonomyPagePath(segment: TaxonomySegment, slug: string, page: number): string {
  if (page <= 1) return taxonomyPath(segment, slug);
  return `${taxonomyPath(segment, slug)}/page/${page}`;
}

export function categoryPath(slug: string): string {
  return taxonomyPath("categories", slug);
}

export function categoryPagePath(slug: string, page: number): string {
  return taxonomyPagePath("categories", slug, page);
}

export function tagPath(slug: string): string {
  return taxonomyPath("tags", slug);
}

export function tagPagePath(slug: string, page: number): string {
  return taxonomyPagePath("tags", slug, page);
}

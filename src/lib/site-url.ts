import { getPublicSiteOrigin } from "@/config/env.public";

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

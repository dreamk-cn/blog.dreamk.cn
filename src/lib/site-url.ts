import { isDev } from "@/utils/env";

/** 对外站点根地址，无末尾斜杠（与 NEXT_PUBLIC_BASE_URL 一致） */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (isDev) return "http://localhost:3000";
  throw new Error("NEXT_PUBLIC_BASE_URL must be set in production");
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

import { isDev } from "@/utils/env";

/** 对外站点根地址，无末尾斜杠（与 NEXT_PUBLIC_BASE_URL 一致） */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const base = raw || (isDev ? "http://localhost:3000" : "https://blog.dreamk.cn");
  return base.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

import type { NextRequest } from "next/server";

/** Sec-Fetch-Dest 为这些值时明确不是页面浏览 */
const NON_PAGE_FETCH_DEST = new Set([
  "audio",
  "audioworklet",
  "embed",
  "font",
  "image",
  "manifest",
  "object",
  "paintworklet",
  "report",
  "script",
  "serviceworker",
  "sharedworker",
  "style",
  "track",
  "video",
  "worker",
  "xslt",
]);

/**
 * 是否应记录为一次「页面访问」：
 * - 硬刷新 / 外链进入：Sec-Fetch-Dest=document（或无头）
 * - 站内 Link 点击：RSC=1 + Next-Router-State-Tree（常为 Sec-Fetch-Dest=empty）
 * 排除 prefetch、静态资源类 fetch、/.well-known/*、/auth/*、/admin/*
 */
export function shouldLogAccess(request: NextRequest): boolean {
  if (request.method !== "GET") {
    return false;
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return false;
  }

  // Link hover / viewport prefetch，不是真实访问（真实点击时此头为 null，不会进这里）
  if (request.headers.get("Next-Router-Prefetch")) {
    return false;
  }

  const isRsc = request.headers.get("RSC") === "1";
  if (isRsc) {
    // 客户端路由跳转（点击 <Link>）
    return request.headers.has("Next-Router-State-Tree");
  }

  const fetchDest = request.headers.get("Sec-Fetch-Dest");
  if (fetchDest && NON_PAGE_FETCH_DEST.has(fetchDest)) {
    return false;
  }

  return true;
}

/** 开发环境默认站点根地址（无末尾斜杠） */
export const DEV_SITE_ORIGIN = "http://localhost:3000";

/** 客户端安全：仅依赖 NODE_ENV */
export const isDev = process.env.NODE_ENV === "development";

/**
 * 客户端安全：解析对外站点根地址（无末尾斜杠）。
 * 仅读取 NEXT_PUBLIC_BASE_URL 与 NODE_ENV，可被打进 client bundle。
 */
export function getPublicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (isDev) return DEV_SITE_ORIGIN;
  throw new Error("NEXT_PUBLIC_BASE_URL must be set in production");
}

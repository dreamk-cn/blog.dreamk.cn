import { unstable_cache } from "next/cache";

/** 公开列表类内容默认缓存 5 分钟（首次访问后写入 Data Cache，build 阶段不预渲染） */
export const PUBLIC_CONTENT_REVALIDATE_SEC = 300;

/** About 页内容缓存 30 秒 */
export const PUBLIC_ABOUT_REVALIDATE_SEC = 30;

export const PUBLIC_CACHE_TAGS = {
  posts: "public:posts",
  categories: "public:categories",
  friendLinks: "public:friend-links",
  sitemap: "public:sitemap",
} as const;

type CachePublicContentOptions = {
  revalidate: number;
  tags?: string[];
};

/** 首次请求时写入 Next.js Data Cache，到期后后台再验证 */
export function cachePublicContent<T>(
  fn: () => Promise<T>,
  key: string[],
  options: CachePublicContentOptions,
): Promise<T> {
  return unstable_cache(fn, key, options)();
}

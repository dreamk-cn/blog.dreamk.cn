import { revalidateTag, unstable_cache } from "next/cache";

/** 公开列表类内容默认缓存 5 分钟（首次访问后写入 Data Cache，build 阶段不预渲染） */
export const PUBLIC_CONTENT_REVALIDATE_SEC = 300;

/** About 页内容缓存 30 秒 */
export const PUBLIC_ABOUT_REVALIDATE_SEC = 30;

export const PUBLIC_CACHE_TAGS = {
  posts: "public:posts",
  categories: "public:categories",
  tags: "public:tags",
  friendLinks: "public:friend-links",
  comments: "public:comments",
  sitemap: "public:sitemap",
} as const;

export function publicCategoryCacheTag(slug: string) {
  return `public:category:${slug}`;
}

export function publicTagCacheTag(slug: string) {
  return `public:tag:${slug}`;
}

/** 分类/标签写操作后失效相关公开缓存 */
export function revalidateTaxonomyWriteCaches(
  taxonomy: "categories" | "tags",
  slugs: string[],
) {
  const listTag = taxonomy === "categories" ? PUBLIC_CACHE_TAGS.categories : PUBLIC_CACHE_TAGS.tags;
  const slugTag = taxonomy === "categories" ? publicCategoryCacheTag : publicTagCacheTag;

  revalidatePublicCache(listTag, PUBLIC_CACHE_TAGS.sitemap, PUBLIC_CACHE_TAGS.posts);
  for (const slug of slugs) {
    if (slug) {
      revalidatePublicCache(slugTag(slug));
    }
  }
}

/** 文章或标签变更后失效相关公开缓存 */
export function revalidatePostAndTagCaches(options?: { postSlugs?: string[]; tagSlugs?: string[] }) {
  const tags: string[] = [
    PUBLIC_CACHE_TAGS.posts,
    PUBLIC_CACHE_TAGS.tags,
    PUBLIC_CACHE_TAGS.sitemap,
  ];
  for (const slug of options?.postSlugs ?? []) {
    tags.push(`public:post:${slug}`);
  }
  for (const slug of options?.tagSlugs ?? []) {
    tags.push(publicTagCacheTag(slug));
  }
  revalidatePublicCache(...tags);
}

type CachePublicContentOptions = {
  revalidate: number;
  tags?: string[];
};

/** 写操作后主动失效 Data Cache（如评论审核、删除） */
export function revalidatePublicCache(...tags: string[]) {
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }
}

/** 评论状态变更是否影响首页「最近留言」等公开缓存 */
export function shouldRevalidatePublicComments(previousStatus: string, nextStatus: string) {
  if (nextStatus === "APPROVED" || nextStatus === "DELETED") {
    return true;
  }
  return previousStatus === "APPROVED";
}

/** 首次请求时写入 Next.js Data Cache，到期后后台再验证 */
export function cachePublicContent<T>(
  fn: () => Promise<T>,
  key: string[],
  options: CachePublicContentOptions,
): Promise<T> {
  return unstable_cache(fn, key, options)();
}

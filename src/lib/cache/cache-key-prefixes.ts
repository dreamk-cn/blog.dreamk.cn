/** 客户端可安全导入的缓存键前缀（无服务端 env / Prisma 依赖） */

/** 与后台「清除匿名评论限流」快捷操作共用此前缀 */
export const ANON_COMMENT_RATE_CACHE_KEY_PREFIX = "ratelimit:comment:anon:v1:";

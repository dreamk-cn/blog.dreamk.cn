import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import type { CacheStore, CacheStoreAdmin } from "./cache-store";
import { PrismaAppCache } from "./prisma-app-cache";

export type CacheDriver = "postgres" | "redis";

function resolveDriver(): CacheDriver {
  return env.cache.driver;
}

let prismaCacheSingleton: PrismaAppCache | null = null;

function getPrismaAppCache(): PrismaAppCache {
  if (!prismaCacheSingleton) {
    prismaCacheSingleton = new PrismaAppCache(prisma);
  }
  return prismaCacheSingleton;
}

/**
 * 按环境变量 {@link CacheDriver} 创建缓存实现。当前仅实现 `postgres`。
 */
export function createCacheStore(): CacheStore {
  const driver = resolveDriver();
  if (driver === "redis") {
    throw new Error(
      'CACHE_DRIVER=redis 尚未实现。请使用 postgres（默认）或实现 Redis 适配器后接入 createCacheStore。',
    );
  }
  return getPrismaAppCache();
}

let singleton: CacheStore | null = null;

/** 进程内单例，避免重复构造 */
export function getCacheStore(): CacheStore {
  if (!singleton) {
    singleton = createCacheStore();
  }
  return singleton;
}

/**
 * 管理台用的缓存运维接口。换用 Redis 后需实现 {@link CacheStoreAdmin} 并在本函数返回；
 * 未实现前返回 null，API 层应提示「当前驱动不支持」。
 */
export function getCacheStoreAdmin(): CacheStoreAdmin | null {
  if (resolveDriver() !== "postgres") {
    return null;
  }
  return getPrismaAppCache();
}

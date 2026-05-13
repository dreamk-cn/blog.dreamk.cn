import { prisma } from "@/lib/prisma";
import type { CacheStore } from "./cache-store";
import { PrismaAppCache } from "./prisma-app-cache";

export type CacheDriver = "postgres" | "redis";

function resolveDriver(): CacheDriver {
  const raw = (process.env.CACHE_DRIVER ?? "postgres").trim().toLowerCase();
  if (raw === "redis") {
    return "redis";
  }
  return "postgres";
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
  return new PrismaAppCache(prisma);
}

let singleton: CacheStore | null = null;

/** 进程内单例，避免重复构造 */
export function getCacheStore(): CacheStore {
  if (!singleton) {
    singleton = createCacheStore();
  }
  return singleton;
}

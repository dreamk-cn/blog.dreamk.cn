import { getCacheStoreAdmin } from "@/lib/cache/create-cache-store";
import type { CacheEntryListItem } from "@/lib/cache/cache-store";

export type AppCacheListItem = CacheEntryListItem;

/** 当前驱动未实现 {@link import("@/lib/cache/cache-store").CacheStoreAdmin} 时返回 null */
export async function listAppCaches(params: { pageNo: number; pageSize: number; keyword?: string }) {
  const admin = getCacheStoreAdmin();
  if (!admin) {
    return null;
  }
  return admin.listEntries(params);
}

export async function deleteAppCacheByKey(key: string) {
  const admin = getCacheStoreAdmin();
  if (!admin) {
    return null;
  }
  return admin.deleteEntry(key);
}

export async function deleteAppCachesByPrefix(prefix: string) {
  const admin = getCacheStoreAdmin();
  if (!admin) {
    return null;
  }
  return admin.deleteByPrefix(prefix);
}

export async function deleteExpiredAppCaches() {
  const admin = getCacheStoreAdmin();
  if (!admin) {
    return null;
  }
  return admin.purgeExpiredEntries();
}

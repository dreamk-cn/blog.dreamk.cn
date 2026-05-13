export type CacheSetOptions = {
  /** Time-to-live from now; omit for no expiry */
  ttlMs?: number;
};

/**
 * 应用层键值缓存抽象。PostgreSQL（Prisma）与 Redis 等可实现同一接口，由工厂切换。
 */
export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;

  /**
   * 原子自增：不存在或已过期则从 1 开始并设置过期时间；否则在剩余 TTL 内 +1。
   * @returns 自增后的计数值
   */
  incrementWithTtl(key: string, ttlMs: number): Promise<number>;
}

/** 管理台列表一行（与存储无关的通用形状） */
export type CacheEntryListItem = {
  key: string;
  value: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 可选的「后台可观测 / 可运维」能力：SQL 类存储易实现列表与按前缀清理；
 * Redis 可用 SCAN + UNLINK 等实现；未实现时 {@link import("./create-cache-store").getCacheStoreAdmin} 返回 null。
 */
export interface CacheStoreAdmin {
  listEntries(params: { pageNo: number; pageSize: number; keyword?: string }): Promise<{
    list: CacheEntryListItem[];
    total: number;
  }>;
  deleteEntry(key: string): Promise<{ deleted: 0 | 1 }>;
  deleteByPrefix(prefix: string): Promise<{ deleted: number }>;
  /** 删除 expiresAt 早于当前时间的行（纯内存 TTL 的驱动可实现为 no-op 并返回 0） */
  purgeExpiredEntries(): Promise<{ deleted: number }>;
}

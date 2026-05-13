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

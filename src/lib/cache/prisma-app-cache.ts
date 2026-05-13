import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { CacheStore, CacheSetOptions } from "./cache-store";

export class PrismaAppCache implements CacheStore {
  constructor(private readonly db: PrismaClient) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.appCache.findUnique({
      where: { key },
      select: { value: true, expiresAt: true },
    });
    if (!row) {
      return null;
    }
    if (row.expiresAt != null && row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return row.value;
  }

  async set(key: string, value: string, options?: CacheSetOptions): Promise<void> {
    const expiresAt =
      options?.ttlMs != null && options.ttlMs > 0 ? new Date(Date.now() + options.ttlMs) : null;
    await this.db.appCache.upsert({
      where: { key },
      create: { key, value, expiresAt },
      update: { value, expiresAt },
    });
  }

  async delete(key: string): Promise<void> {
    await this.db.appCache.deleteMany({ where: { key } });
  }

  async incrementWithTtl(key: string, ttlMs: number): Promise<number> {
    const expiresAt = new Date(Date.now() + Math.max(1, ttlMs));
    const rows = await this.db.$queryRaw<{ value: string }[]>(
      Prisma.sql`
        INSERT INTO "AppCache" ("key", "value", "expiresAt", "createdAt", "updatedAt")
        VALUES (${key}, '1', ${expiresAt}, NOW(), NOW())
        ON CONFLICT ("key") DO UPDATE SET
          "value" = CASE
            WHEN "AppCache"."expiresAt" IS NOT NULL AND "AppCache"."expiresAt" <= NOW() THEN '1'
            ELSE (GREATEST(COALESCE(NULLIF(trim("AppCache"."value"), ''), '0')::INTEGER, 0) + 1)::TEXT
          END,
          "expiresAt" = CASE
            WHEN "AppCache"."expiresAt" IS NOT NULL AND "AppCache"."expiresAt" <= NOW() THEN ${expiresAt}
            ELSE "AppCache"."expiresAt"
          END,
          "updatedAt" = NOW()
        RETURNING "value";
      `,
    );
    const raw = rows[0]?.value ?? "1";
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 1;
  }
}

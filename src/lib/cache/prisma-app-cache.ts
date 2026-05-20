import { Prisma } from "@/generated/prisma";
import type { PrismaClient } from "@/generated/prisma";
import type { CacheStore, CacheSetOptions, CacheStoreAdmin } from "./cache-store";

export class PrismaAppCache implements CacheStore, CacheStoreAdmin {
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

  async listEntries(params: { pageNo: number; pageSize: number; keyword?: string }) {
    const { pageNo, pageSize, keyword } = params;
    const safePage = Math.max(1, pageNo);
    const safeSize = Math.min(100, Math.max(1, pageSize));
    const skip = (safePage - 1) * safeSize;

    const kw = keyword?.trim();
    const where = kw
      ? {
          key: { contains: kw, mode: "insensitive" as const },
        }
      : {};

    const [total, list] = await Promise.all([
      this.db.appCache.count({ where }),
      this.db.appCache.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: safeSize,
        select: {
          key: true,
          value: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return { list, total };
  }

  async deleteEntry(key: string): Promise<{ deleted: 0 | 1 }> {
    try {
      await this.db.appCache.delete({ where: { key } });
      return { deleted: 1 };
    } catch {
      return { deleted: 0 };
    }
  }

  async deleteByPrefix(prefix: string): Promise<{ deleted: number }> {
    const result = await this.db.appCache.deleteMany({
      where: { key: { startsWith: prefix } },
    });
    return { deleted: result.count };
  }

  async purgeExpiredEntries(): Promise<{ deleted: number }> {
    const result = await this.db.appCache.deleteMany({
      where: {
        expiresAt: { not: null, lt: new Date() },
      },
    });
    return { deleted: result.count };
  }
}

import { fail, internalError, ok } from "@/lib/api-response";
import { ResponseCode } from "@/config/response-code";
import { requireAdmin } from "@/lib/route-auth";
import {
  deleteAppCacheByKey,
  deleteAppCachesByPrefix,
  deleteExpiredAppCaches,
  listAppCaches,
} from "@/services/app-cache-admin";
import { NextRequest } from "next/server";
import z from "zod";

const listQuerySchema = z.object({
  pageNo: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().max(512).optional(),
});

const postBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("clearPrefix"),
    prefix: z.string().min(1).max(512),
  }),
  z.object({
    action: z.literal("clearExpired"),
  }),
]);

const CACHE_ADMIN_UNSUPPORTED =
  "当前 CACHE_DRIVER 未提供后台缓存运维接口。请使用 postgres，或为 Redis 等驱动实现 CacheStoreAdmin 后在工厂中返回。";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = request.nextUrl;
    const parsed = listQuerySchema.parse({
      pageNo: searchParams.get("pageNo") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      keyword: searchParams.get("keyword")?.trim() || undefined,
    });
    const data = await listAppCaches(parsed);
    if (data === null) {
      return fail(ResponseCode.FAIL, CACHE_ADMIN_UNSUPPORTED);
    }
    return ok(data, "获取缓存列表成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(ResponseCode.FAIL, err.issues[0]?.message || "参数错误");
    }
    console.error("[admin/app-cache GET]", err);
    return internalError();
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const key = request.nextUrl.searchParams.get("key")?.trim();
    if (!key || key.length > 512) {
      return fail(ResponseCode.FAIL, "缺少或无效的 key");
    }
    const delResult = await deleteAppCacheByKey(key);
    if (delResult === null) {
      return fail(ResponseCode.FAIL, CACHE_ADMIN_UNSUPPORTED);
    }
    const { deleted } = delResult;
    if (deleted === 0) {
      return fail(ResponseCode.FAIL, "条目不存在或已删除");
    }
    return ok({ deleted: 1 }, "已删除缓存条目");
  } catch (err) {
    console.error("[admin/app-cache DELETE]", err);
    return internalError();
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const json = await request.json();
    const body = postBodySchema.parse(json ?? {});

    if (body.action === "clearExpired") {
      const result = await deleteExpiredAppCaches();
      if (result === null) {
        return fail(ResponseCode.FAIL, CACHE_ADMIN_UNSUPPORTED);
      }
      const { deleted } = result;
      return ok({ deleted }, "已清除过期缓存");
    }

    const result = await deleteAppCachesByPrefix(body.prefix);
    if (result === null) {
      return fail(ResponseCode.FAIL, CACHE_ADMIN_UNSUPPORTED);
    }
    const { deleted } = result;
    return ok({ deleted }, `已按前缀清除 ${deleted} 条缓存`);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(ResponseCode.FAIL, err.issues[0]?.message || "参数错误");
    }
    console.error("[admin/app-cache POST]", err);
    return internalError();
  }
}

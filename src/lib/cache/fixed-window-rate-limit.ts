import { getCacheStore } from "./create-cache-store";

export type FixedWindowRateLimitResult =
  | { ok: true; count: number; limit: number; windowSec: number }
  | { ok: false; count: number; limit: number; windowSec: number; retryAfterSec: number };

export function readRateLimitEnvInt(
  name: string,
  fallback: number,
  min = 0,
): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? Math.max(min, n) : fallback;
}

/**
 * 固定窗口计数（自首次请求起 windowSec 内）：超过 limit 则拒绝。
 * limit <= 0 表示关闭限流（调试用）。
 */
export async function consumeFixedWindowRateLimit(params: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<FixedWindowRateLimitResult> {
  const { key, limit, windowSec } = params;
  if (limit <= 0) {
    return { ok: true, count: 0, limit, windowSec };
  }

  const store = getCacheStore();
  const count = await store.incrementWithTtl(key, windowSec * 1000);

  if (count > limit) {
    return {
      ok: false,
      count,
      limit,
      windowSec,
      retryAfterSec: windowSec,
    };
  }

  return { ok: true, count, limit, windowSec };
}

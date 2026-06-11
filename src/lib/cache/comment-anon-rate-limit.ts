import { env } from "@/config/env";
import { ANON_COMMENT_RATE_CACHE_KEY_PREFIX } from "./cache-key-prefixes";
import { getCacheStore } from "./create-cache-store";

export { ANON_COMMENT_RATE_CACHE_KEY_PREFIX };

function anonCommentRateKey(ip: string | null): string {
  const safe = ip?.trim() || "unknown";
  return `${ANON_COMMENT_RATE_CACHE_KEY_PREFIX}${safe}`;
}

function readMaxPerWindow(): number {
  return env.rateLimits.ANONYMOUS_COMMENT_RATE_MAX;
}

function readWindowSec(): number {
  return env.rateLimits.ANONYMOUS_COMMENT_RATE_WINDOW_SEC;
}

export type AnonymousCommentRateResult =
  | { ok: true; count: number; limit: number; windowSec: number }
  | { ok: false; count: number; limit: number; windowSec: number; retryAfterSec: number };

/**
 * 匿名评论固定窗口计数（自首次请求起 `windowSec` 内）：同一 IP 超过上限则拒绝。
 * `ANONYMOUS_COMMENT_RATE_MAX=0` 表示关闭限流（仅调试用）。
 */
export async function consumeAnonymousCommentRateLimit(ip: string | null): Promise<AnonymousCommentRateResult> {
  const limit = readMaxPerWindow();
  const windowSec = readWindowSec();
  if (limit <= 0) {
    return { ok: true, count: 0, limit, windowSec };
  }

  const key = anonCommentRateKey(ip);
  const ttlMs = windowSec * 1000;
  const store = getCacheStore();
  const count = await store.incrementWithTtl(key, ttlMs);

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

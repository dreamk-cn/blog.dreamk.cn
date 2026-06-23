import {
  consumeFixedWindowRateLimit,
  readRateLimitEnvInt,
  type FixedWindowRateLimitResult,
} from "./fixed-window-rate-limit";

export const POST_VIEW_RATE_CACHE_KEY_PREFIX = "ratelimit:post:view:v1:";

function postViewRateKey(ip: string | null, slug: string): string {
  const safeIp = ip?.trim() || "unknown";
  return `${POST_VIEW_RATE_CACHE_KEY_PREFIX}${safeIp}:${slug}`;
}

function readPostViewLimit() {
  return readRateLimitEnvInt("POST_VIEW_RATE_MAX", 1);
}

function readPostViewWindowSec() {
  return readRateLimitEnvInt("POST_VIEW_RATE_WINDOW_SEC", 86400, 1);
}

/** 文章浏览量：同一 IP + slug 在窗口内超过上限则拒绝计数 */
export async function consumePostViewRateLimit(
  ip: string | null,
  slug: string,
): Promise<FixedWindowRateLimitResult> {
  return consumeFixedWindowRateLimit({
    key: postViewRateKey(ip, slug),
    limit: readPostViewLimit(),
    windowSec: readPostViewWindowSec(),
  });
}

import {
  consumeFixedWindowRateLimit,
  readRateLimitEnvInt,
  type FixedWindowRateLimitResult,
} from "./fixed-window-rate-limit";

export const FRIEND_LINK_APPLY_RATE_CACHE_KEY_PREFIX = "ratelimit:friend-link:apply:v1:";

function friendLinkApplyRateKey(ip: string | null): string {
  const safe = ip?.trim() || "unknown";
  return `${FRIEND_LINK_APPLY_RATE_CACHE_KEY_PREFIX}${safe}`;
}

function readLimit() {
  return readRateLimitEnvInt("FRIEND_LINK_APPLY_RATE_MAX", 3);
}

function readWindowSec() {
  return readRateLimitEnvInt("FRIEND_LINK_APPLY_RATE_WINDOW_SEC", 3600, 1);
}

/** 友链公开申请：同一 IP 在窗口内超过上限则拒绝 */
export async function consumeFriendLinkApplyRateLimit(
  ip: string | null,
): Promise<FixedWindowRateLimitResult> {
  return consumeFixedWindowRateLimit({
    key: friendLinkApplyRateKey(ip),
    limit: readLimit(),
    windowSec: readWindowSec(),
  });
}

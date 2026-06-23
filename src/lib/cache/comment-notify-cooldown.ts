import {
  consumeFixedWindowRateLimit,
  readRateLimitEnvInt,
} from "./fixed-window-rate-limit";

export const COMMENT_NOTIFY_ADMIN_COOLDOWN_CACHE_KEY_PREFIX = "notify:comment:admin:v1:";

function adminNotifyCooldownKey(postId: string): string {
  return `${COMMENT_NOTIFY_ADMIN_COOLDOWN_CACHE_KEY_PREFIX}${postId}`;
}

function readAdminNotifyCooldownSec() {
  return readRateLimitEnvInt("COMMENT_NOTIFY_ADMIN_COOLDOWN_SEC", 300, 0);
}

/**
 * 站长评论通知冷却：同一 postId 在窗口内仅允许首次发信。
 * `COMMENT_NOTIFY_ADMIN_COOLDOWN_SEC=0` 表示关闭去重。
 */
export async function tryConsumeAdminCommentNotifyCooldown(postId: string): Promise<boolean> {
  const windowSec = readAdminNotifyCooldownSec();
  if (windowSec <= 0) {
    return true;
  }

  const result = await consumeFixedWindowRateLimit({
    key: adminNotifyCooldownKey(postId),
    limit: 1,
    windowSec,
  });

  return result.ok;
}

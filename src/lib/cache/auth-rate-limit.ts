import {
  consumeFixedWindowRateLimit,
  readRateLimitEnvInt,
  type FixedWindowRateLimitResult,
} from "./fixed-window-rate-limit";

export const AUTH_REGISTER_RATE_CACHE_KEY_PREFIX = "ratelimit:auth:register:v1:";
export const AUTH_LOGIN_RATE_CACHE_KEY_PREFIX = "ratelimit:auth:login:v1:";

function authRateKey(prefix: string, ip: string | null): string {
  const safe = ip?.trim() || "unknown";
  return `${prefix}${safe}`;
}

function readRegisterLimit() {
  return readRateLimitEnvInt("AUTH_REGISTER_RATE_MAX", 5);
}

function readRegisterWindowSec() {
  return readRateLimitEnvInt("AUTH_REGISTER_RATE_WINDOW_SEC", 3600, 1);
}

function readLoginLimit() {
  return readRateLimitEnvInt("AUTH_LOGIN_RATE_MAX", 10);
}

function readLoginWindowSec() {
  return readRateLimitEnvInt("AUTH_LOGIN_RATE_WINDOW_SEC", 300, 1);
}

/** 注册接口：同一 IP 在窗口内超过上限则拒绝 */
export async function consumeAuthRegisterRateLimit(
  ip: string | null,
): Promise<FixedWindowRateLimitResult> {
  return consumeFixedWindowRateLimit({
    key: authRateKey(AUTH_REGISTER_RATE_CACHE_KEY_PREFIX, ip),
    limit: readRegisterLimit(),
    windowSec: readRegisterWindowSec(),
  });
}

/** 凭证登录：同一 IP 在窗口内超过上限则拒绝 */
export async function consumeAuthLoginRateLimit(
  ip: string | null,
): Promise<FixedWindowRateLimitResult> {
  return consumeFixedWindowRateLimit({
    key: authRateKey(AUTH_LOGIN_RATE_CACHE_KEY_PREFIX, ip),
    limit: readLoginLimit(),
    windowSec: readLoginWindowSec(),
  });
}

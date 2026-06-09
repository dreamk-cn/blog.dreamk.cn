import { getCacheStore } from "./create-cache-store";
import {
  consumeFixedWindowRateLimit,
  readRateLimitEnvInt,
  type FixedWindowRateLimitResult,
} from "./fixed-window-rate-limit";

export const REGISTER_SEND_CODE_IP_RATE_CACHE_KEY_PREFIX = "ratelimit:auth:register:send-code:ip:v1:";
export const REGISTER_SEND_CODE_EMAIL_RATE_CACHE_KEY_PREFIX =
  "ratelimit:auth:register:send-code:email:v1:";
export const REGISTER_SEND_CODE_COOLDOWN_CACHE_KEY_PREFIX = "auth:register:send-cooldown:v1:";

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readSendCodeIpLimit() {
  return readRateLimitEnvInt("AUTH_REGISTER_SEND_CODE_IP_MAX", 5);
}

function readSendCodeIpWindowSec() {
  return readRateLimitEnvInt("AUTH_REGISTER_SEND_CODE_IP_WINDOW_SEC", 3600, 1);
}

function readSendCodeEmailLimit() {
  return readRateLimitEnvInt("AUTH_REGISTER_SEND_CODE_EMAIL_MAX", 3);
}

function readSendCodeEmailWindowSec() {
  return readRateLimitEnvInt("AUTH_REGISTER_SEND_CODE_EMAIL_WINDOW_SEC", 3600, 1);
}

function readSendCodeCooldownSec() {
  return readRateLimitEnvInt("AUTH_REGISTER_SEND_CODE_COOLDOWN_SEC", 60, 1);
}

export async function consumeRegisterSendCodeIpRateLimit(
  ip: string | null,
): Promise<FixedWindowRateLimitResult> {
  const safe = ip?.trim() || "unknown";
  return consumeFixedWindowRateLimit({
    key: `${REGISTER_SEND_CODE_IP_RATE_CACHE_KEY_PREFIX}${safe}`,
    limit: readSendCodeIpLimit(),
    windowSec: readSendCodeIpWindowSec(),
  });
}

export async function consumeRegisterSendCodeEmailRateLimit(
  email: string,
): Promise<FixedWindowRateLimitResult> {
  return consumeFixedWindowRateLimit({
    key: `${REGISTER_SEND_CODE_EMAIL_RATE_CACHE_KEY_PREFIX}${normEmail(email)}`,
    limit: readSendCodeEmailLimit(),
    windowSec: readSendCodeEmailWindowSec(),
  });
}

export async function checkRegisterSendCodeCooldown(
  email: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const cooldownSec = readSendCodeCooldownSec();
  const store = getCacheStore();
  const key = `${REGISTER_SEND_CODE_COOLDOWN_CACHE_KEY_PREFIX}${normEmail(email)}`;
  const stored = await store.get(key);
  if (!stored) {
    return { ok: true };
  }

  const sentAt = Number.parseInt(stored, 10);
  if (!Number.isFinite(sentAt)) {
    return { ok: true };
  }

  const elapsedSec = Math.floor((Date.now() - sentAt) / 1000);
  if (elapsedSec >= cooldownSec) {
    return { ok: true };
  }

  return { ok: false, retryAfterSec: cooldownSec - elapsedSec };
}

export async function markRegisterSendCodeCooldown(email: string): Promise<void> {
  const cooldownSec = readSendCodeCooldownSec();
  const store = getCacheStore();
  const key = `${REGISTER_SEND_CODE_COOLDOWN_CACHE_KEY_PREFIX}${normEmail(email)}`;
  await store.set(key, String(Date.now()), { ttlMs: cooldownSec * 1000 });
}

export function readRegisterSendCodeCooldownSec(): number {
  return readSendCodeCooldownSec();
}

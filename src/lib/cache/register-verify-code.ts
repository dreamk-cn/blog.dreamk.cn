import { randomInt } from "node:crypto";

import { normalizeEmail } from "@/lib/email";
import { getCacheStore } from "./create-cache-store";
import { readRateLimitEnvInt } from "./fixed-window-rate-limit";

export const REGISTER_VERIFY_CODE_CACHE_KEY_PREFIX = "auth:register:code:v1:";

export type RegisterVerifyCodeError = "missing" | "expired" | "invalid";

function codeKey(email: string): string {
  return `${REGISTER_VERIFY_CODE_CACHE_KEY_PREFIX}${normalizeEmail(email)}`;
}

function readCodeTtlSec(): number {
  return readRateLimitEnvInt("AUTH_REGISTER_CODE_TTL_SEC", 600, 1);
}

export function generateRegisterVerifyCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function saveRegisterVerifyCode(email: string): Promise<string> {
  const code = generateRegisterVerifyCode();
  const store = getCacheStore();
  const ttlMs = readCodeTtlSec() * 1000;
  await store.set(codeKey(email), code, { ttlMs });
  return code;
}

export async function verifyAndConsumeRegisterCode(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: RegisterVerifyCodeError }> {
  const store = getCacheStore();
  const key = codeKey(email);
  const stored = await store.get(key);
  if (!stored) {
    return { ok: false, error: "missing" };
  }

  const input = code.trim();
  if (input !== stored) {
    return { ok: false, error: "invalid" };
  }

  await store.delete(key);
  return { ok: true };
}

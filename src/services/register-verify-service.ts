import { siteConfig } from "@/config/site";
import {
  checkRegisterSendCodeCooldown,
  consumeRegisterSendCodeEmailRateLimit,
  consumeRegisterSendCodeIpRateLimit,
  markRegisterSendCodeCooldown,
  readRateLimitEnvInt,
  saveRegisterVerifyCode,
  verifyAndConsumeRegisterCode,
} from "@/lib/cache";
import { sendSmtpMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { buildRegisterVerificationEmail } from "@/lib/register-email-html";
import { isDev } from "@/utils/env";

function readCodeTtlSec(): number {
  return readRateLimitEnvInt("AUTH_REGISTER_CODE_TTL_SEC", 600, 1);
}

function registerVerifyErrorMessage(
  error: "missing" | "expired" | "invalid",
): string {
  if (error === "missing") {
    return "验证码已过期或未发送，请重新获取";
  }
  return "验证码错误";
}

export async function sendRegisterVerificationCode(params: {
  email: string;
  ip: string | null;
}): Promise<
  | { data: null }
  | { error: string; retryAfterSec?: number; status?: 409 | 429 }
> {
  const email = params.email.trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return { error: "该邮箱已经被注册了", status: 409 };
  }

  const cooldown = await checkRegisterSendCodeCooldown(email);
  if (!cooldown.ok) {
    return {
      error: `发送过于频繁，请 ${cooldown.retryAfterSec} 秒后再试`,
      retryAfterSec: cooldown.retryAfterSec,
      status: 429,
    };
  }

  const ipRate = await consumeRegisterSendCodeIpRateLimit(params.ip);
  if (!ipRate.ok) {
    return {
      error: `发送过于频繁，每 ${ipRate.windowSec} 秒最多 ${ipRate.limit} 次，请稍后再试`,
      retryAfterSec: ipRate.retryAfterSec,
      status: 429,
    };
  }

  const emailRate = await consumeRegisterSendCodeEmailRateLimit(email);
  if (!emailRate.ok) {
    return {
      error: `该邮箱发送次数过多，每 ${emailRate.windowSec} 秒最多 ${emailRate.limit} 次，请稍后再试`,
      retryAfterSec: emailRate.retryAfterSec,
      status: 429,
    };
  }

  const code = await saveRegisterVerifyCode(email);
  const expiresMinutes = Math.max(1, Math.ceil(readCodeTtlSec() / 60));
  const { text, html } = buildRegisterVerificationEmail({ code, expiresMinutes });
  const mail = await sendSmtpMail({
    to: email,
    subject: `${siteConfig.name} 注册验证码`,
    text,
    html,
  });

  if (!mail.ok) {
    if (isDev) {
      console.info(`[register-verify] email=${email} code=${code}`);
      await markRegisterSendCodeCooldown(email);
      return { data: null };
    }
    return { error: "验证码发送失败，请稍后重试" };
  }

  await markRegisterSendCodeCooldown(email);
  return { data: null };
}

export async function verifyRegisterCode(
  email: string,
  code: string,
): Promise<{ ok: true } | { error: string }> {
  const result = await verifyAndConsumeRegisterCode(email, code);
  if (!result.ok) {
    return { error: registerVerifyErrorMessage(result.error) };
  }
  return { ok: true };
}

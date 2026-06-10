import { ResponseCode } from "@/config/response-code";

export type CredentialsLoginResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

const CREDENTIALS_PROVIDER_ID = "dreamk-credentials";

/** Auth.js v5：用此头让 callback 返回 JSON `{ url }`，而非 302 重定向 */
const AUTH_RETURN_REDIRECT_HEADER = "X-Auth-Return-Redirect";

const CREDENTIALS_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "账号或密码错误",
  invalid_credentials: "账号或密码错误",
  account_blocked: "账号已被禁用",
  account_unavailable: "账号不可用",
  credentials_required: "邮箱和密码不能为空",
};

type CallbackPayload = {
  url?: string;
  error?: string;
  code?: number;
  message?: string;
};

function parseStructuredAuthError(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { errors?: { message?: string }[] };
    const message = parsed.errors?.[0]?.message;
    return typeof message === "string" && message.trim() ? message : null;
  } catch {
    return null;
  }
}

function resolveAuthErrorMessage(data: CallbackPayload, fallback: string): string {
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data.error === "string" && data.error.trim()) {
    return parseStructuredAuthError(data.error) ?? data.error;
  }
  return fallback;
}

/**
 * 直接调用 NextAuth 凭证回调（X-Auth-Return-Redirect 模式），绕过 signIn() 对非标准响应的解析问题。
 */
export async function loginWithCredentials(input: {
  email: string;
  password: string;
  callbackUrl: string;
}): Promise<CredentialsLoginResult> {
  const csrfRes = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!csrfRes.ok) {
    return { ok: false, status: csrfRes.status, error: "遇到未知错误，请重试" };
  }

  const csrfData = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfData.csrfToken) {
    return { ok: false, status: 500, error: "遇到未知错误，请重试" };
  }

  const body = new URLSearchParams({
    csrfToken: csrfData.csrfToken,
    email: input.email,
    password: input.password,
    callbackUrl: input.callbackUrl,
  });

  const res = await fetch(`/api/auth/callback/${CREDENTIALS_PROVIDER_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      [AUTH_RETURN_REDIRECT_HEADER]: "1",
    },
    body,
    credentials: "same-origin",
  });

  let data: CallbackPayload = {};
  try {
    data = (await res.json()) as CallbackPayload;
  } catch {
    data = {};
  }

  if (data.code === ResponseCode.TOO_MANY_REQUESTS) {
    return {
      ok: false,
      status: ResponseCode.TOO_MANY_REQUESTS,
      error:
        typeof data.message === "string" && data.message.trim()
          ? data.message
          : "登录尝试过于频繁，请稍后再试",
    };
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return {
      ok: false,
      status: res.status,
      error: resolveAuthErrorMessage(data, "无效的邮箱或密码"),
    };
  }

  if (typeof data.url === "string" && data.url) {
    try {
      const resultUrl = new URL(data.url, window.location.origin);
      const urlError = resultUrl.searchParams.get("error");
      if (urlError) {
        const errorCode = resultUrl.searchParams.get("code");
        const message =
          (errorCode && CREDENTIALS_ERROR_MESSAGES[errorCode]) ||
          CREDENTIALS_ERROR_MESSAGES[urlError] ||
          parseStructuredAuthError(urlError) ||
          "账号或密码错误";
        return {
          ok: false,
          status: 401,
          error: message,
        };
      }
    } catch {
      return { ok: false, status: 500, error: "遇到未知错误，请重试" };
    }
    return { ok: true };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, error: "无效的邮箱或密码" };
  }

  return { ok: false, status: res.status, error: "遇到未知错误，请重试" };
}

export type CredentialsLoginResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

const CREDENTIALS_PROVIDER_ID = "dreamk-credentials";

/**
 * 直接调用 NextAuth 凭证回调（json 模式），绕过 signIn() 对非标准响应的解析问题。
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
    json: "true",
  });

  const res = await fetch(`/api/auth/callback/${CREDENTIALS_PROVIDER_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    credentials: "same-origin",
  });

  let data: { url?: string; error?: string } = {};
  try {
    data = (await res.json()) as { url?: string; error?: string };
  } catch {
    data = {};
  }

  if (res.status === 429) {
    return {
      ok: false,
      status: 429,
      error:
        typeof data.error === "string" && data.error.trim()
          ? data.error
          : "登录尝试过于频繁，请稍后再试",
    };
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return { ok: false, status: res.status, error: data.error };
  }

  if (typeof data.url === "string" && data.url) {
    try {
      const resultUrl = new URL(data.url, window.location.origin);
      if (resultUrl.searchParams.get("error")) {
        return { ok: false, status: 401, error: "无效的邮箱或密码" };
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

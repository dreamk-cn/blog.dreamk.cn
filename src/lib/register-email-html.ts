import { siteConfig } from "@/config/site";
import { escapeHtml } from "@/lib/comment-email-html";

function emailShell(params: {
  eyebrow: string;
  headline: string;
  bodyHtml: string;
  footerLine?: string;
}): string {
  const brand = escapeHtml(siteConfig.name);
  const eyebrow = escapeHtml(params.eyebrow);
  const headline = escapeHtml(params.headline);
  const footer = params.footerLine
    ? escapeHtml(params.footerLine)
    : `此邮件由 ${brand} 自动发送，请勿直接回复。`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(24,24,27,0.08);">
        <tr>
          <td style="padding:28px 32px 8px 32px;background:linear-gradient(135deg,#18181b 0%,#3f3f46 100%);">
            <p style="margin:0 0 6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa;">${eyebrow}</p>
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;font-size:20px;font-weight:700;line-height:1.35;color:#fafafa;">${brand}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;">
            <h1 style="margin:0 0 20px 0;font-size:18px;font-weight:700;line-height:1.4;color:#18181b;">${headline}</h1>
            ${params.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;">
            <p style="margin:24px 0 0 0;padding-top:20px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.6;color:#71717a;">${footer}</p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:#a1a1aa;">${brand} · 注册验证</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function buildRegisterVerificationEmail(input: {
  code: string;
  expiresMinutes: number;
}): { text: string; html: string } {
  const { code, expiresMinutes } = input;
  const text = `您的注册验证码是：${code}\n\n验证码 ${expiresMinutes} 分钟内有效，请勿泄露给他人。如非本人操作，请忽略此邮件。`;

  const bodyHtml = `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#52525b;">您正在注册 ${escapeHtml(siteConfig.name)} 账号，请使用以下验证码完成注册：</p>
<div style="margin:0 0 18px 0;padding:20px 16px;background-color:#fafafa;border-radius:12px;border:1px dashed #d4d4d8;text-align:center;">
  <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#18181b;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(code)}</p>
</div>
<p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">验证码 ${expiresMinutes} 分钟内有效。如非本人操作，请忽略此邮件。</p>`;

  const html = emailShell({
    eyebrow: "账号注册",
    headline: "邮箱验证码",
    bodyHtml,
    footerLine: `此邮件用于 ${siteConfig.name} 注册验证，请勿将验证码告知他人。`,
  });

  return { text, html };
}

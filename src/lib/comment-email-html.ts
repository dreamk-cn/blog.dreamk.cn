import { siteConfig } from "@/config/site";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailShell(params: {
  eyebrow: string;
  headline: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
  footerLine?: string;
}): string {
  const brand = escapeHtml(siteConfig.name);
  const eyebrow = escapeHtml(params.eyebrow);
  const headline = escapeHtml(params.headline);
  const ctaLabel = escapeHtml(params.ctaLabel);
  const ctaHref = escapeHtml(params.ctaHref);
  const footer = params.footerLine ? escapeHtml(params.footerLine) : `此邮件由 ${brand} 自动发送，请勿直接回复。`;

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
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0 0;">
              <tr>
                <td style="border-radius:10px;background-color:#18181b;">
                  <a href="${ctaHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;font-size:15px;font-weight:600;color:#fafafa;text-decoration:none;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;">
            <p style="margin:24px 0 0 0;padding-top:20px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.6;color:#71717a;">${footer}</p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:#a1a1aa;">${brand} · 评论通知</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function quoteBlock(label: string, value: string): string {
  return `<p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(label)}</p>
<div style="margin:0 0 18px 0;padding:14px 16px;background-color:#fafafa;border-radius:10px;border-left:4px solid #3f3f46;font-size:15px;line-height:1.55;color:#3f3f46;white-space:pre-wrap;word-break:break-word;">${escapeHtml(value)}</div>`;
}

function metaRow(label: string, value: string): string {
  return `<p style="margin:0 0 10px 0;font-size:14px;line-height:1.5;color:#52525b;"><span style="color:#a1a1aa;">${escapeHtml(label)}</span><strong style="color:#18181b;font-weight:600;">${escapeHtml(value)}</strong></p>`;
}

function pendingPill(): string {
  return `<span style="display:inline-block;margin:0 0 16px 0;padding:4px 10px;border-radius:9999px;background-color:#fef3c7;color:#92400e;font-size:12px;font-weight:600;">待审核</span>`;
}

export function buildAdminNewCommentEmail(input: {
  postTitle: string;
  postUrl: string;
  author: string;
  preview: string;
  pending: boolean;
}): { text: string; html: string } {
  const { postTitle, postUrl, author, preview, pending } = input;
  const pendingLine = pending ? "\n状态：待审核\n" : "\n";
  const text = `文章：${postTitle}\n链接：${postUrl}${pendingLine}\n评论者：${author}\n\n内容摘要：\n${preview}\n`;

  const bodyHtml = `${pending ? pendingPill() : ""}
${metaRow("文章", postTitle)}
${metaRow("评论者", author)}
${quoteBlock("内容", preview)}`;

  const html = emailShell({
    eyebrow: "站长通知",
    headline: "文章收到了一条新评论",
    bodyHtml,
    ctaLabel: "打开文章",
    ctaHref: postUrl,
  });

  return { text, html };
}

export function buildAdminNewReplyEmail(input: {
  postTitle: string;
  postUrl: string;
  author: string;
  preview: string;
  pending: boolean;
}): { text: string; html: string } {
  const { postTitle, postUrl, author, preview, pending } = input;
  const pendingLine = pending ? "\n状态：待审核\n" : "\n";
  const text = `文章：${postTitle}\n链接：${postUrl}${pendingLine}\n回复者：${author}\n\n内容摘要：\n${preview}\n`;

  const bodyHtml = `${pending ? pendingPill() : ""}
${metaRow("文章", postTitle)}
${metaRow("回复者", author)}
${quoteBlock("内容", preview)}`;

  const html = emailShell({
    eyebrow: "站长通知",
    headline: "评论下有了新回复",
    bodyHtml,
    ctaLabel: "查看对话",
    ctaHref: postUrl,
  });

  return { text, html };
}

export function buildParentReplyReceivedEmail(input: {
  postTitle: string;
  postUrl: string;
  replyAuthor: string;
  preview: string;
}): { text: string; html: string } {
  const { postTitle, postUrl, replyAuthor, preview } = input;
  const text = `${replyAuthor} 在《${postTitle}》下回复了您：\n\n${preview}\n\n查看全文：${postUrl}\n`;

  const bodyHtml = `${metaRow("文章", postTitle)}
${metaRow("回复者", replyAuthor)}
${quoteBlock("回复内容", preview)}`;

  const html = emailShell({
    eyebrow: "互动提醒",
    headline: `您在「${postTitle}」下的评论有了新回复`,
    bodyHtml,
    ctaLabel: "前往查看",
    ctaHref: postUrl,
    footerLine: `此邮件由 ${siteConfig.name} 在有人回复您的评论时自动发送。`,
  });

  return { text, html };
}

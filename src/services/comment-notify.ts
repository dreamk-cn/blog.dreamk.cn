import {
  buildAdminNewCommentEmail,
  buildAdminNewReplyEmail,
  buildParentReplyReceivedEmail,
} from "@/lib/comment-email-html";
import { postUrlWithCommentAnchor } from "@/lib/comment-anchor";
import { sendSmtpMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { isDev } from "@/utils/env";

function publicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.trim() || (isDev ? "http://localhost:3000" : "https://blog.dreamk.cn")
  );
}

function postUrl(slug: string) {
  return `${publicBaseUrl()}/posts/${encodeURIComponent(slug)}`;
}

function excerpt(text: string, max = 400) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function normEmail(e: string | undefined | null) {
  return e?.trim().toLowerCase() ?? "";
}

async function loadCommentWithParent(commentId: string) {
  const row = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      content: true,
      status: true,
      parentId: true,
      userId: true,
      postId: true,
      user: { select: { id: true, name: true, email: true } },
      post: { select: { title: true, slug: true } },
    },
  });
  if (!row) return null;

  const parent = row.parentId
    ? await prisma.comment.findFirst({
        where: { id: row.parentId, postId: row.postId },
        select: {
          id: true,
          userId: true,
          user: { select: { id: true, name: true, email: true } },
        },
      })
    : null;

  return { row, parent };
}

function authorLabel(user: { name: string | null; email: string | null } | null) {
  if (!user) return "访客";
  return user.name?.trim() || user.email || "用户";
}

/** 新评论/回复提交后：通知站长；已通过审核的回复同时通知被回复的登录用户 */
export async function notifyOnCommentCreated(commentId: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const loaded = await loadCommentWithParent(commentId);
  if (!loaded) return;

  const { row, parent } = loaded;
  const { post } = row;
  const link = postUrlWithCommentAnchor(postUrl(post.slug), row.id);
  const bodyPreview = excerpt(row.content);
  const adminNorm = normEmail(adminEmail);
  const authorNorm = normEmail(row.user?.email);
  const skipAdminNotify = Boolean(adminNorm && authorNorm && adminNorm === authorNorm);

  if (adminEmail && !skipAdminNotify) {
    const pendingNote = row.status === "PENDING" ? "（待审核）" : "";
    const pending = row.status === "PENDING";
    const author = authorLabel(row.user);
    if (!row.parentId) {
      const { text, html } = buildAdminNewCommentEmail({
        postTitle: post.title,
        postUrl: link,
        author,
        preview: bodyPreview,
        pending,
      });
      await sendSmtpMail({
        to: adminEmail,
        subject: `[博客] 文章有新评论${pendingNote}`,
        text,
        html,
      });
    } else {
      const { text, html } = buildAdminNewReplyEmail({
        postTitle: post.title,
        postUrl: link,
        author,
        preview: bodyPreview,
        pending,
      });
      await sendSmtpMail({
        to: adminEmail,
        subject: `[博客] 评论有新回复${pendingNote}`,
        text,
        html,
      });
    }
  }

  if (row.status !== "APPROVED" || !row.parentId || !parent) {
    return;
  }

  const parentEmail = parent.user?.email?.trim();
  if (!parentEmail) return;
  if (parent.userId && row.userId && parent.userId === row.userId) return;

  const parentMail = buildParentReplyReceivedEmail({
    postTitle: post.title,
    postUrl: link,
    replyAuthor: authorLabel(row.user),
    preview: bodyPreview,
  });
  await sendSmtpMail({
    to: parentEmail,
    subject: `[博客] 您在《${post.title}》下的评论收到了回复`,
    text: parentMail.text,
    html: parentMail.html,
  });
}

/**
 * 管理员将待审核回复改为通过后，通知被回复者（仅访客回复：创建时为待审，被回复者此前未收到邮件）。
 * 登录用户评论创建时已是已通过并在 notifyOnCommentCreated 中已通知被回复者；若管理员改为待审再
 * 通过，不应再次发信。
 */
export async function notifyParentOnCommentApproved(commentId: string): Promise<void> {
  const loaded = await loadCommentWithParent(commentId);
  if (!loaded) return;

  const { row, parent } = loaded;
  if (row.status !== "APPROVED" || !row.parentId || !parent) return;
  if (row.userId) return;

  const parentEmail = parent.user?.email?.trim();
  if (!parentEmail) return;
  if (parent.userId && row.userId && parent.userId === row.userId) return;

  const { post } = row;
  const link = postUrlWithCommentAnchor(postUrl(post.slug), row.id);
  const bodyPreview = excerpt(row.content);

  const parentMail = buildParentReplyReceivedEmail({
    postTitle: post.title,
    postUrl: link,
    replyAuthor: authorLabel(row.user),
    preview: bodyPreview,
  });
  await sendSmtpMail({
    to: parentEmail,
    subject: `[博客] 您在《${post.title}》下的评论收到了回复`,
    text: parentMail.text,
    html: parentMail.html,
  });
}

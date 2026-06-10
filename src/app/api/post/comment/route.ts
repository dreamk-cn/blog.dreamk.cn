import { auth } from "@/auth";
import { ResponseCode } from "@/config/response-code";
import { consumeAnonymousCommentRateLimit } from "@/lib/cache";
import { fail, ok, tooManyRequests } from "@/lib/api-response";
import { getRequestIp } from "@/lib/request-ip";
import { parseJson, withRoute } from "@/lib/route-handler";
import {
  CommentCreateSchema,
  CommentListSchema,
  CommentReplyListSchema,
  CommentSelfDeleteSchema,
} from "@/schemas/comment";
import { notifyOnCommentCreated } from "@/services/comment-notify";
import {
  createComment,
  listApprovedCommentsBySlug,
  listApprovedRepliesForRootSlug,
  softDeleteOwnCommentBySlug,
} from "@/services/comment-service";
import { NextResponse } from "next/server";

export const GET = withRoute(async (request) => {
  const { searchParams } = request.nextUrl;
  const rootId = searchParams.get("rootId")?.trim();

  if (rootId) {
    const { slug, rootId: parsedRootId, replySkip, replyTake } = CommentReplyListSchema.parse({
      slug: searchParams.get("slug"),
      rootId,
      replySkip: searchParams.get("replySkip") ?? undefined,
      replyTake: searchParams.get("replyTake") ?? undefined,
    });
    const data = await listApprovedRepliesForRootSlug(slug, parsedRootId, {
      skip: replySkip,
      take: replyTake,
    });
    if (!data) {
      return fail(ResponseCode.FAIL, "评论不存在");
    }
    return ok(data, "获取回复成功");
  }

  const { slug, skip, take, replyTake } = CommentListSchema.parse({
    slug: searchParams.get("slug"),
    skip: searchParams.get("skip") ?? undefined,
    take: searchParams.get("take") ?? undefined,
    replyTake: searchParams.get("replyTake") ?? undefined,
  });

  const { comments, totalRootCount } = await listApprovedCommentsBySlug(slug, {
    rootSkip: skip,
    rootTake: take,
    replySkip: 0,
    replyTake,
  });

  return ok({ comments, totalRootCount }, "获取评论成功");
}, "获取评论失败");

export const POST = withRoute(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { slug, content, parentId } = CommentCreateSchema.parse(json ?? {});
  const session = await auth();
  const userId = session?.user?.id || undefined;
  const status = userId ? "APPROVED" : "PENDING";

  if (!userId) {
    const ip = getRequestIp(request);
    const rate = await consumeAnonymousCommentRateLimit(ip);
    if (!rate.ok) {
      return tooManyRequests(
        `匿名留言过于频繁，每 ${rate.windowSec} 秒最多 ${rate.limit} 条，请稍后再试`,
        rate.retryAfterSec,
      );
    }
  }

  const created = await createComment({
    slug,
    content: content.trim(),
    parentId,
    userId,
    userIp: getRequestIp(request) || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
    status,
  });

  if (!created) {
    return fail(ResponseCode.FAIL, "文章不存在或未发布");
  }

  void notifyOnCommentCreated(created.id).catch((err) => {
    console.error("[notifyOnCommentCreated]", err);
  });

  return ok(
    { comment: created, status },
    status === "APPROVED" ? "评论发布成功" : "留言已提交，等待审核",
  );
}, "发表评论失败");

export const DELETE = withRoute(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { slug, id } = CommentSelfDeleteSchema.parse(json ?? {});
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return fail(ResponseCode.UNAUTHORIZED, "请先登录");
  }

  const deleted = await softDeleteOwnCommentBySlug({ slug, id, userId });
  if (!deleted) {
    return fail(ResponseCode.FAIL, "评论不存在或无权限删除");
  }

  return ok(deleted, "评论删除成功");
}, "删除评论失败");

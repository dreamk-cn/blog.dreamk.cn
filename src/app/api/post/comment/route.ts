import { auth } from "@/auth";
import { ResponseCode } from "@/config/response-code";
import { fail, internalError, ok, zodFail } from "@/libs/api-response";
import { CommentCreateSchema, CommentListSchema } from "@/schemas/comment";
import { createComment, listApprovedCommentsBySlug } from "@/services/comment-service";
import { NextRequest } from "next/server";
import z from "zod";

function getRequestIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const { slug } = CommentListSchema.parse({
      slug: searchParams.get("slug"),
    });

    const comments = await listApprovedCommentsBySlug(slug);
    return ok(comments, "获取评论成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { slug, content, parentId } = CommentCreateSchema.parse(json ?? {});
    const session = await auth();
    const userId = session?.user?.id || undefined;
    const status = userId ? "APPROVED" : "PENDING";

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

    return ok(
      {
        comment: created,
        status,
      },
      status === "APPROVED" ? "评论发布成功" : "留言已提交，等待审核",
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError();
  }
}

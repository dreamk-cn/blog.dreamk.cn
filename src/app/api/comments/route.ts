import { ResponseCode } from "@/config/response-code";
import { fail, internalError, ok, zodFail } from "@/libs/api-response";
import { requireAdmin } from "@/libs/route-auth";
import {
  CommentAdminListSchema,
  CommentDeleteSchema,
  CommentUpdateStatusSchema,
} from "@/schemas/comment";
import { listComments, softDeleteComments, updateCommentStatus } from "@/services/comment-service";
import { NextRequest } from "next/server";
import z from "zod";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = request.nextUrl;
    const parsed = CommentAdminListSchema.parse({
      pageNo: searchParams.get("pageNo"),
      pageSize: searchParams.get("pageSize"),
      keyword: searchParams.get("keyword"),
      sortOrder: searchParams.get("sortOrder"),
      status: searchParams.get("status") || undefined,
    });

    const { pageNo, pageSize, keyword, sortOrder, status } = parsed;
    const { comments, total } = await listComments({
      pageNo,
      pageSize,
      keyword: keyword || undefined,
      sortOrder,
      status,
    });
    return ok(
      {
        list: comments,
        total,
        totalPages: Math.ceil(total / pageSize),
        pageNo,
        pageSize,
      },
      "获取评论列表成功",
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError("获取评论列表失败");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const { id, status } = CommentUpdateStatusSchema.parse(json ?? {});
    const updated = await updateCommentStatus({ id, status });
    if (!updated) {
      return fail(ResponseCode.FAIL, "评论不存在");
    }
    return ok(updated, "更新评论状态成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError("更新评论状态失败");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const { ids } = CommentDeleteSchema.parse(json ?? {});
    const { count } = await softDeleteComments(ids);
    return ok(null, `删除${count}条评论`);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError("删除评论失败");
  }
}

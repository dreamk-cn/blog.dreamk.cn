import { ResponseCode } from "@/config/response-code";
import { fail, ok } from "@/lib/api-response";
import { parseJson, withAdmin } from "@/lib/route-handler";
import {
  CommentAdminListSchema,
  CommentDeleteSchema,
  CommentUpdateStatusSchema,
} from "@/schemas/comment";
import { notifyParentOnCommentApproved } from "@/services/comment-notify";
import { listComments, softDeleteComments, updateCommentStatus } from "@/services/comment-service";
import { NextResponse } from "next/server";

export const GET = withAdmin(async (request) => {
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
}, "获取评论列表失败");

export const PUT = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { id, status } = CommentUpdateStatusSchema.parse(json ?? {});
  const result = await updateCommentStatus({ id, status });
  if (!result) {
    return fail(ResponseCode.FAIL, "评论不存在");
  }

  if (result.previousStatus === "PENDING" && status === "APPROVED") {
    void notifyParentOnCommentApproved(id).catch((err) => {
      console.error("[notifyParentOnCommentApproved]", err);
    });
  }

  return ok(result.updated, "更新评论状态成功");
}, "更新评论状态失败");

export const DELETE = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { ids } = CommentDeleteSchema.parse(json ?? {});
  const { count } = await softDeleteComments(ids);
  return ok(null, `删除${count}条评论`);
}, "删除评论失败");

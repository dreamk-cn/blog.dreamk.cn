import z from "zod";
import zValue from ".";

export const CommentListSchema = z.object({
  slug: zValue(z.string().min(1, "slug不能为空")),
});

export const CommentCreateSchema = z.object({
  slug: zValue(z.string().min(1, "slug不能为空")),
  content: zValue(z.string().min(2, "评论内容至少2个字符").max(2000, "评论内容过长")),
  parentId: zValue(z.string().optional()),
});

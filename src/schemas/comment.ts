import z from "zod";
import zValue from ".";
import { SearchPageSchema } from "./page";

export const CommentListSchema = z.object({
  slug: zValue(z.string().min(1, "slug不能为空")),
  skip: z.coerce.number().int().min(0).optional().default(0),
  take: z.coerce.number().int().min(1).max(50).optional().default(20),
  replyTake: z.coerce.number().int().min(1).max(50).optional().default(5),
});

export const CommentReplyListSchema = z.object({
  slug: zValue(z.string().min(1, "slug不能为空")),
  rootId: zValue(z.string().min(1, "rootId不能为空")),
  replySkip: z.coerce.number().int().min(0).optional().default(0),
  replyTake: z.coerce.number().int().min(1).max(500).optional().default(5),
});

export const CommentCreateSchema = z.object({
  slug: zValue(z.string().min(1, "slug不能为空")),
  content: zValue(z.string().min(2, "评论内容至少2个字符").max(2000, "评论内容过长")),
  parentId: zValue(z.string().optional()),
});

export const CommentSelfDeleteSchema = z.object({
  slug: zValue(z.string().min(1, "slug不能为空")),
  id: zValue(z.string().min(1, "评论ID不能为空")),
});

export const CommentAdminListSchema = SearchPageSchema.extend({
  status: zValue(z.enum(["PENDING", "APPROVED", "SPAM", "DELETED"]).optional()),
});

export const CommentUpdateStatusSchema = z.object({
  id: zValue(z.string().min(1, "评论ID不能为空")),
  status: zValue(z.enum(["PENDING", "APPROVED", "SPAM", "DELETED"])),
});

export const CommentDeleteSchema = z.object({
  ids: zValue(z.array(z.string().min(1)).min(1, "至少提供一个评论ID")),
});

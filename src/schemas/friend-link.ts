import z from "zod";
import zValue from ".";

const linkStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]);

export const FriendLinkListQuerySchema = z.object({
  keyword: zValue(z.string().optional()),
  status: zValue(linkStatusEnum.optional()),
});

export const FriendLinkCreateSchema = z.object({
  name: zValue(z.string().min(1).max(100)),
  url: zValue(z.url().max(200)),
  email: zValue(z.email().max(100).optional()),
  avatar: zValue(z.url().max(200).optional()),
  description: zValue(z.string().max(500).optional()),
  status: zValue(linkStatusEnum.optional()),
  sortOrder: zValue(z.coerce.number().int().min(0).max(9999).optional()),
});

export const FriendLinkUpdateSchema = FriendLinkCreateSchema.extend({
  id: zValue(z.string()),
});

export const FriendLinkDeleteSchema = z.object({
  id: zValue(z.string()),
});

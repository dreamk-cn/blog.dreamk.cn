import z from "zod";
import zValue from ".";

export const TagDetailSchema = z.object({
  id: zValue(z.string())
})

export const TagCreateSchema = z.object({
  name: zValue(z.string().min(1).max(50)),
  slug: zValue(z.string().optional()),
})

export const TagUpdateSchema = TagCreateSchema.extend({
  id: zValue(z.string()),
})

export const TagDeleteSchema = z.object({
  id: zValue(z.string()),
})
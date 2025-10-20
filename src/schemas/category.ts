import z from "zod"
import zValue from "."

export const CategoryListSchema = z.object({
  id: zValue(z.string().optional()),
  name: zValue(z.string().optional()),
  slug: zValue(z.string().optional()),
}).superRefine((data, ctx) => {
  if (!data.id && !data.slug) {
    ctx.addIssue({
      code: 'custom',
      message: 'id和slug不能同时为空',
      path: ['id', 'slug']
    })
  }
})

export const CategoryCreateSchema = z.object({
  name: zValue(z.string().min(1).max(100)),
  slug: zValue(z.string().optional()),
})

export const CategoryUpdateSchema = CategoryCreateSchema.extend({
  id: zValue(z.string())
})

export const CategoryDeleteSchema = z.object({
  id: zValue(z.string()),
})
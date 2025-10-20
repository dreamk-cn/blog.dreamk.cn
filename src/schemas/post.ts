import z from "zod";
import zValue from ".";
import { $Enums } from "@prisma/client";
import { SearchPageSchema } from "./page";

type PostStatus = $Enums.PostStatus;

// 文章详情查询参数（支持id或slug）
export const PostDetailSchema = z.object({
  id: zValue(z.string().optional()),
  slug: zValue(z.string().optional()),
  status: zValue(z.enum<PostStatus[]>(['ARCHIVED', 'DRAFT', 'PUBLISHED']).default('PUBLISHED'))
}).superRefine((data, ctx) => {
  if (!data.id && !data.slug) {
    ctx.addIssue({
      code: 'custom',
      message: 'id和slug不能同时为空',
      path: ['id', 'slug']
    })
  }
})


// 文章列表查询参数（支持分页、搜索、排序）
export const PostListSchema = SearchPageSchema.extend({
  sortBy: zValue(z.enum(['createdAt', 'updatedAt', 'title', 'content'], { error: 'sortBy字段错误'}).default('createdAt')),
  status: zValue(z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'))
})


// 文章创建参数（支持草稿、已发布、已归档状态）
export const PostCreateSchema = z.object({
  title: zValue(z.string().min(1).max(255)),
  slug: zValue(z.string().min(1).max(255)),
  content: zValue(z.string().min(1)),
  excerpt: zValue(z.string().min(1)),
  status: zValue(z.enum<PostStatus[]>(['ARCHIVED', 'DRAFT', 'PUBLISHED']).default('PUBLISHED')),
  featured: zValue(z.boolean().default(false)),
  coverUrl: zValue(z.string().optional()),
  categoryId: zValue(z.string().optional()),
  tags: zValue(z.array(
    z.object({
      name: zValue(z.string().optional()),
      id: zValue(z.string().optional()),
      slug: zValue(z.string().optional())
    }).superRefine((data, ctx) => {
      if (!data.id && !data.name) {
        ctx.addIssue({
          code: 'custom',
          message: 'id和name不能同时为空',
          path: ['id', 'name']
        })
      }
    })
  ).default([]))
})

// 文章更新参数（支持草稿、已发布、已归档状态）
export const PostUpdateSchema = PostCreateSchema.extend({
  id: zValue(z.string().min(1))
})

// 文章删除参数（支持批量删除）
export const PostDeleteSchema = z.object({
  ids: zValue(z.array(z.string()).default([])),
})
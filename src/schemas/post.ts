import z from "zod";
import zValue from ".";
import { $Enums } from "@/generated/prisma";
import { SearchPageSchema } from "./page";

type PostStatus = $Enums.PostStatus;

// 文章详情查询参数（支持id或slug）
export const PostDetailSchema = z.object({
  id: zValue(z.string().optional()),
  slug: zValue(z.string().optional()),
  status: zValue(z.enum<PostStatus[]>(['ARCHIVED', 'DRAFT', 'PUBLISHED']).optional())
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
  status: zValue(z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional())
})


// 文章创建参数（支持草稿、已发布、已归档状态）
export const PostCreateSchema = z.object({
  title: zValue(z.string().min(1).max(255)),
  slug: zValue(
    z.string()
      .min(1)
      .max(255)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug只能包含小写字母、数字和连字符')
  ),
  content: zValue(z.string().min(1)),
  excerpt: zValue(z.string().min(1)),
  status: zValue(z.enum<PostStatus[]>(['ARCHIVED', 'DRAFT', 'PUBLISHED']).default('PUBLISHED')),
  publishedAt: zValue(z.coerce.date().optional()),
  featured: zValue(z.boolean().default(false)),
  coverMediaFileIds: zValue(z.array(z.string().min(1)).default([])),
  contentMediaFileIds: zValue(z.array(z.string().min(1)).default([])),
  categoryId: zValue(z.string().optional()),
  category: zValue(
    z
      .object({
        id: zValue(z.string().optional()),
        name: zValue(z.string().min(1).max(100).optional()),
        slug: zValue(z.string().optional()),
      })
      .optional(),
  ),
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

export const PostViewSchema = z.object({
  slug: zValue(z.string().trim().min(1, "slug不能为空")),
})

export const GenerateSlugSchema = z.object({
  title: zValue(z.string().trim().min(1, "标题不能为空").max(255)),
  content: zValue(z.string().trim().max(20000).optional()),
})

export const GenerateExcerptSchema = z.object({
  content: zValue(
    z
      .string()
      .trim()
      .min(20, "正文内容太短，无法生成摘要")
      .max(20000, "正文内容过长，请精简后重试"),
  ),
})

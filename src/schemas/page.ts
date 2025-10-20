import { z } from 'zod';
import zValue from '.';

// 分页查询参数
export const PageSchema = z.object({
  pageNo: zValue(z.coerce.number().min(1).default(1)),
  pageSize: zValue(z.coerce.number().min(1).max(100).default(10))
})

// 分页查询参数（支持搜索、排序）
export const SearchPageSchema = PageSchema.extend({
  keyword: zValue(z.string().nullish().default('')),
  sortOrder: zValue(z.enum(['asc', 'desc'], { error: 'sortOrder字段错误' }).default('desc'))
})
import { auth } from '@/auth';
import { internalError, ok, zodFail } from '@/lib/api-response';
import { PostListSchema } from '@/schemas/post';
import { listPosts } from '@/services/post-service';
import { NextRequest } from 'next/server'
import { z } from 'zod'

// 获取文章列表（支持分页、搜索、排序）
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const parsedParams = PostListSchema.parse({
      pageNo: searchParams.get('pageNo'),
      pageSize: searchParams.get('pageSize'),
      keyword: searchParams.get('keyword'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      status: searchParams.get('status')
    });
    const session = await auth()
    const isAdmin = session?.user.role === 'ADMIN'
    const { pageNo, pageSize, keyword, sortBy, sortOrder, status } = parsedParams;
    const { posts, total } = await listPosts({
      pageNo,
      pageSize,
      keyword: keyword ?? undefined,
      sortBy,
      sortOrder,
      status,
      isAdmin,
    });
    return ok({
      list: posts,
      total: total,
      totalPages: Math.ceil(total / pageSize),
      pageNo: pageNo,
      pageSize: pageSize,
      sortBy: sortBy,
      sortOrder: sortOrder,
    }, '获取文章列表成功')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误')
    }
    console.error('err', err)
    return internalError()
  }
}
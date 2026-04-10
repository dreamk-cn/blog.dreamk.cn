import { auth } from '@/auth';
import { internalError, ok, zodFail } from '@/libs/api-response';
import { prisma } from '@/libs/prisma';
import { PostListSchema } from '@/schemas/post';
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
    const query: Parameters<typeof prisma.post.findMany>[0] = {
      include: {
        category: true,
        tags: true,
      },
      where: {
        status: isAdmin ? status : 'PUBLISHED',
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (pageNo - 1) * pageSize,
      take: pageSize,
    };

    if (keyword) {
      query.where = {
        ...query.where,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' }},
          { content: { contains: keyword, mode: 'insensitive' }}
        ]
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany(query),
      prisma.post.count({ where: query.where })
    ])
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
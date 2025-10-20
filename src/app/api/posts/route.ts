import { auth } from '@/auth';
import { ResponseCode } from '@/config/reponse-code';
import { prisma } from '@/libs/prisma';
import { PostListSchema } from '@/schemas/post';
import { NextRequest, NextResponse} from 'next/server'
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
    return NextResponse.json({
      code: 200,
      message: `获取文章列表成功`,
      data: {
        list: posts,
        total: total,
        totalPages: Math.ceil(total / pageSize),
        pageNo: pageNo,
        pageSize: pageSize,
        sortBy: sortBy,
        sortOrder: sortOrder,
      }
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        code: ResponseCode.FAIL,
        message: err.issues[0]
      })
    }
    console.error('err', err)
    return NextResponse.json({
      code: ResponseCode.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误'
    })
  }
}
// /api/post
import { auth } from "@/auth";
import { ResponseCode, ResponseMap } from "@/config/reponse-code";
import { prisma } from "@/libs/prisma";
import { PostCreateSchema, PostDeleteSchema, PostDetailSchema, PostUpdateSchema } from "@/schemas/post";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";


// 获取文章详情（支持id或slug）
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const parser = PostDetailSchema.parse({
      id: searchParams.get('id'),
      slug: searchParams.get('slug'),
      status: searchParams.get('status')
    })

    const { id, slug, status } = parser;
    const queryKey = id ? 'id' : 'slug' as const
    const queryValue = id ? id : slug as string
    
    // 构建查询条件
    const query: Parameters<typeof prisma.post.findUnique>[0] = {
      // @ts-expect-error queryKey是id或者slug，类型足够安全
      where: {
        [queryKey]: queryValue
      },
      include: {
        tags: true,
        category: true
      }
    }
    
    // 如果不是管理员，只返回已发布的文章
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN';
    
    if (!isAdmin) {
      query.where = {
        ...query.where,
        status: 'PUBLISHED'
      };
    } else {
      query.where = {
        ...query.where,
        status
      }
    }
    
    const post = await prisma.post.findUnique(query);

    if (!post) {
      return NextResponse.json({
        code: 400,
        message: '文章不存在'
      })
    }
    
    return NextResponse.json({
      code: 200,
      message: '获取文章成功',
      data: post
    });
  } catch(err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        code: 400,
        message: err.issues[0]?.message || '参数错误'
      })
    }
    console.error('获取文章失败:', err)
    return NextResponse.json({
      code: 500,
      message: '服务器内部错误'
    })
  }
}

// 创建文章（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    console.warn('session', session)
    if (!session?.user.id) {
      return NextResponse.json({
        code: ResponseCode.UNAUTHORIZED,
        message: '请登录后在操作'
      })
    }
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({
        code: ResponseCode.FORBIDDEN,
        message: '您没有操作权限'
      })
    }

    const json = await request.json()

    const parsed = PostCreateSchema.parse(json ?? {})
    const { title, slug, content, excerpt, status, featured, coverUrl, categoryId, tags } = parsed

    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        status,
        content,
        excerpt,
        featured,
        coverUrl,
        userId: session.user.id,
        categoryId,
        ...(tags.length > 0 ? {
          tags: {
            connectOrCreate: tags.map(tag => ({
              where: {
                id: tag.id || ''
              },
              create: {
                name: tag.name!,
                slug: (tag.slug || tag.name)!.toLowerCase().replace(/ /g, '-')
              }
            }))
          }
        } : {})
      },
    })

    console.warn('newPost', newPost)

    return NextResponse.json({
      code: ResponseCode.SUCCESS,
      data: newPost
    })
  } catch(err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        code: ResponseCode.FAIL,
        message: err.issues[0]
      })
    }
    console.warn('err', err)
    return NextResponse.json({
      code: ResponseCode.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误'
    })
  }
}

// 更新文章（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user.id) {
      return NextResponse.json({
        code: ResponseCode.UNAUTHORIZED,
        message: '请登录后在操作'
      })
    }
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({
        code: ResponseCode.FORBIDDEN,
        message: '您没有操作权限'
      })
    }

    const json = await request.json()
    const parsed = PostUpdateSchema.parse(json ?? {})
    const { id, title, slug, content, excerpt, status, featured, coverUrl, categoryId, tags } = parsed

    // 检查文章是否存在
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { tags: true }
    })

    if (!existingPost) {
      return NextResponse.json({
        code: ResponseCode.FAIL,
        message: '文章不存在'
      })
    }

    // 更新文章
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt,
        status,
        featured,
        coverUrl,
        categoryId,
        // 更新标签关系
        tags: {
          // 先断开所有已有标签关联
          disconnect: existingPost.tags.map(tag => ({ id: tag.id })),
          // 然后连接新的标签
          connectOrCreate: tags.map(tag => ({
            where: {
              id: tag.id || ''
            },
            create: {
              name: tag.name!,
              slug: (tag.slug || tag.name)!.toLowerCase().replace(/ /g, '-')
            }
          }))
        }
      },
      include: {
        tags: true,
        category: true
      }
    })

    return NextResponse.json({
      code: ResponseCode.SUCCESS,
      data: updatedPost
    })
  } catch(err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        code: 400,
        message: err.issues[0]?.message || '参数错误'
      })
    }
    console.error('更新文章失败:', err)
    return NextResponse.json({
      code: 500,
      message: '服务器内部错误'
    })
  }
}

// 删除文章（仅管理员）
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user.id) {
      return NextResponse.json(ResponseMap[ResponseCode.UNAUTHORIZED])
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(ResponseMap[ResponseCode.FORBIDDEN])
    }

    const json = await request.json()
    const { ids } = PostDeleteSchema.parse(json ?? {})

    const { count } = await prisma.post.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      code: ResponseCode.SUCCESS,
      message: `删除${count}条文章`
    })
  } catch(err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        code: 400,
        message: err.issues[0]
      })
    }
    console.error('err', err)
    return NextResponse.json(ResponseMap[ResponseCode.INTERNAL_SERVER_ERROR])
  }
}
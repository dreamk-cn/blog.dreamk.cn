// /api/post
import { auth } from "@/auth";
import { ResponseCode } from "@/config/response-code";
import { fail, internalError, ok, zodFail } from "@/libs/api-response";
import { prisma } from "@/libs/prisma";
import { requireAdmin } from "@/libs/route-auth";
import { PostCreateSchema, PostDeleteSchema, PostDetailSchema, PostUpdateSchema } from "@/schemas/post";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import z from "zod";

function toTagConnectOrCreate(tags: Array<{ id?: string; name?: string; slug?: string }>): Prisma.TagCreateOrConnectWithoutPostsInput[] {
  return tags.map((tag) => {
    const normalizedSlug = (tag.slug || tag.name || "").toLowerCase().replace(/ /g, "-");
    const tagName = tag.name || normalizedSlug || "untitled-tag";

    return {
      where: tag.id ? { id: tag.id } : { slug: normalizedSlug },
      create: {
        name: tagName,
        slug: normalizedSlug || tagName,
      },
    };
  });
}


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
      return fail(ResponseCode.FAIL, "文章不存在")
    }
    
    return ok(post, "获取文章成功");
  } catch(err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误")
    }
    console.error('获取文章失败:', err)
    return internalError()
  }
}

// 创建文章（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response
    const userId = admin.session.user.id as string

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
        user: { connect: { id: userId } },
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        ...(tags.length > 0 ? {
          tags: {
            connectOrCreate: toTagConnectOrCreate(tags)
          }
        } : {})
      },
    })

    return ok(newPost, "创建文章成功")
  } catch(err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误")
    }
    console.warn('err', err)
    return internalError()
  }
}

// 更新文章（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response

    const json = await request.json()
    const parsed = PostUpdateSchema.parse(json ?? {})
    const { id, title, slug, content, excerpt, status, featured, coverUrl, categoryId, tags } = parsed

    // 检查文章是否存在
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { tags: true }
    })

    if (!existingPost) {
      return fail(ResponseCode.FAIL, "文章不存在")
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
          connectOrCreate: toTagConnectOrCreate(tags)
        }
      },
      include: {
        tags: true,
        category: true
      }
    })

    return ok(updatedPost, "更新文章成功")
  } catch(err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误")
    }
    console.error('更新文章失败:', err)
    return internalError()
  }
}

// 删除文章（仅管理员）
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response

    const json = await request.json()
    const { ids } = PostDeleteSchema.parse(json ?? {})

    const { count } = await prisma.post.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return ok(null, `删除${count}条文章`)
  } catch(err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误")
    }
    console.error('err', err)
    return internalError()
  }
}
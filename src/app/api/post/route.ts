// /api/post
import { auth } from "@/auth";
import { ResponseCode } from "@/config/response-code";
import { fail, internalError, ok, zodFail } from "@/lib/api-response";
import { requireAdmin } from "@/lib/route-auth";
import { PostCreateSchema, PostDeleteSchema, PostDetailSchema, PostUpdateSchema } from "@/schemas/post";
import { createPost, deletePosts, getPostDetail, updatePost } from "@/services/post-service";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import z from "zod";

function prismaPostError(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return fail(ResponseCode.FAIL, "Slug已存在，请换一个");
    }
    if (err.code === "P2025") {
      return fail(ResponseCode.FAIL, "关联的分类或标签不存在");
    }
  }
  return null;
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
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN';

    const post = await getPostDetail({ id, slug, status, isAdmin });

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

    const newPost = await createPost({
      userId,
      title,
      slug,
      content,
      excerpt,
      status,
      featured,
      coverUrl: coverUrl || undefined,
      categoryId: categoryId || undefined,
      tags,
    });

    return ok(newPost, "创建文章成功")
  } catch(err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误")
    }
    const knownError = prismaPostError(err)
    if (knownError) return knownError
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

    const updatedPost = await updatePost({
      id,
      title,
      slug,
      content,
      excerpt,
      status,
      featured,
      coverUrl: coverUrl || undefined,
      categoryId: categoryId || undefined,
      tags,
    });

    if (!updatedPost) {
      return fail(ResponseCode.FAIL, "文章不存在")
    }

    return ok(updatedPost, "更新文章成功")
  } catch(err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误")
    }
    const knownError = prismaPostError(err)
    if (knownError) return knownError
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

    const { count } = await deletePosts(ids)

    return ok(null, `删除${count}条文章`)
  } catch(err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误")
    }
    console.error('err', err)
    return internalError()
  }
}

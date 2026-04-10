import { fail, internalError, ok, zodFail } from '@/libs/api-response'
import { prisma } from '@/libs/prisma'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import z from 'zod'
import { UserUpdateStatusSchema, UserListQuerySchema } from '@/schemas/user'
import { requireAdmin } from '@/libs/route-auth'

// 获取用户列表（支持keyword、status筛选）
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response

    const { searchParams } = request.nextUrl
    const parsed = UserListQuerySchema.parse({
      keyword: searchParams.get('keyword') || undefined,
      status: searchParams.get('status') || undefined,
    })

    const keyword = parsed.keyword ?? ''
    const status = parsed.status

    const query: Prisma.UserFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      where: {},
    }

    if (keyword) {
      query.where = {
        ...query.where,
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
        ],
      }
    }
    if (status) {
      query.where = {
        ...query.where,
        status,
      }
    }

    const users = await prisma.user.findMany(query)
    return ok(users, '获取用户列表成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodFail(error.issues[0]?.message || '参数错误')
    }
    console.error('获取用户列表失败:', error)
    return internalError('获取用户列表失败')
  }
}

// 更新用户状态（封禁/解禁，仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response

    const json = await request.json()
    const parsed = UserUpdateStatusSchema.parse(json ?? {})
    const { id, status } = parsed

    // 禁止管理员封禁自己，避免锁死
    if (id === admin.session.user.id) {
      return fail(400, '不能操作自己的状态')
    }

    const exist = await prisma.user.findUnique({ where: { id } })
    if (!exist) {
      return fail(400, '用户不存在')
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    })

    return ok(updated, '更新用户状态成功')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误')
    }
    console.error('更新用户状态失败:', err)
    return internalError('更新用户状态失败')
  }
}
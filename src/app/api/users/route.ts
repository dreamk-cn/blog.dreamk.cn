import { auth } from '@/auth'
import { prisma } from '@/libs/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import z from 'zod'
import { UserUpdateStatusSchema, UserListQuerySchema } from '@/schemas/user'

// 获取用户列表（支持keyword、status筛选）
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ code: 401, message: '请登录后在操作' })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ code: 403, message: '您没有操作权限' })
    }

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
    return NextResponse.json({ code: 200, message: '获取用户列表成功', data: users })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        code: 400,
        message: error.issues[0]?.message || '参数错误'
      })
    }
    console.error('获取用户列表失败:', error)
    return NextResponse.json({ code: 500, message: '获取用户列表失败', data: [] })
  }
}

// 更新用户状态（封禁/解禁，仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ code: 401, message: '请登录后在操作' })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ code: 403, message: '您没有操作权限' })
    }

    const json = await request.json()
    const parsed = UserUpdateStatusSchema.parse(json ?? {})
    const { id, status } = parsed

    // 禁止管理员封禁自己，避免锁死
    if (id === session.user.id) {
      return NextResponse.json({ code: 400, message: '不能操作自己的状态' })
    }

    const exist = await prisma.user.findUnique({ where: { id } })
    if (!exist) {
      return NextResponse.json({ code: 400, message: '用户不存在' })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ code: 200, message: '更新用户状态成功', data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ code: 400, message: err.issues[0]?.message || '参数错误' })
    }
    console.error('更新用户状态失败:', err)
    return NextResponse.json({ code: 500, message: '更新用户状态失败' })
  }
}
import { auth } from '@/auth';
import { prisma } from '@/libs/prisma';
import { CategoryCreateSchema, CategoryUpdateSchema, CategoryDeleteSchema } from '@/schemas/category';
import z from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

// 获取分类列表（支持keyword搜索）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const keyword = searchParams.get('keyword') || '';

    const query: Prisma.CategoryFindManyArgs = {
      orderBy: { createdAt: 'desc' },
    };
    if (keyword) {
      query.where = {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { slug: { contains: keyword, mode: 'insensitive' } },
        ],
      };
    }

    const categories = await prisma.category.findMany(query);

    return NextResponse.json({
      code: 200,
      message: '获取分类列表成功',
      data: categories,
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json({ code: 500, message: '获取分类列表失败', data: [] });
  }
}

// 创建分类（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ code: 401, message: '请登录后在操作' });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ code: 403, message: '您没有操作权限' });
    }

    const json = await request.json();
    const parsed = CategoryCreateSchema.parse(json ?? {});
    const { name, slug } = parsed;
    const normalizedSlug = (slug || name).toLowerCase().replace(/\s+/g, '-');

    const exists = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug: normalizedSlug }] },
    });
    if (exists) {
      return NextResponse.json({ code: 400, message: '分类已存在' });
    }

    const category = await prisma.category.create({ data: { name, slug: normalizedSlug } });
    return NextResponse.json({ code: 200, message: '创建分类成功', data: category });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ code: 400, message: err.issues[0]?.message || '参数错误' });
    }
    console.error('创建分类失败:', err);
    return NextResponse.json({ code: 500, message: '创建分类失败' });
  }
}

// 更新分类（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ code: 401, message: '请登录后在操作' });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ code: 403, message: '您没有操作权限' });
    }

    const json = await request.json();
    const parsed = CategoryUpdateSchema.parse(json ?? {});
    const { id, name, slug } = parsed;
    const normalizedSlug = (slug || name).toLowerCase().replace(/\s+/g, '-');

    const exists = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug: normalizedSlug }],
        NOT: { id },
      },
    });
    if (exists) {
      return NextResponse.json({ code: 400, message: '分类名或Slug已被使用' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug: normalizedSlug },
    });

    return NextResponse.json({ code: 200, message: '更新分类成功', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ code: 400, message: err.issues[0]?.message || '参数错误' });
    }
    console.error('更新分类失败:', err);
    return NextResponse.json({ code: 500, message: '更新分类失败' });
  }
}

// 删除分类（仅管理员，查询参数传入id）
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ code: 401, message: '请登录后在操作' });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ code: 403, message: '您没有操作权限' });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    CategoryDeleteSchema.parse({ id });

    const exist = await prisma.category.findUnique({ where: { id: id! } });
    if (!exist) {
      return NextResponse.json({ code: 400, message: '分类不存在' });
    }

    await prisma.category.delete({ where: { id: id! } });
    return NextResponse.json({ code: 200, message: '删除分类成功' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ code: 400, message: err.issues[0]?.message || '参数错误' });
    }
    console.error('删除分类失败:', err);
    return NextResponse.json({ code: 500, message: '删除分类失败' });
  }
}
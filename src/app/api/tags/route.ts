import { fail, internalError, ok, zodFail } from '@/libs/api-response';
import { prisma } from '@/libs/prisma';
import { requireAdmin } from '@/libs/route-auth';
import { TagCreateSchema, TagUpdateSchema, TagDeleteSchema } from '@/schemas/tag';
import z from 'zod';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

// 获取标签列表（支持keyword搜索）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const keyword = searchParams.get('keyword') || '';

    const query: Prisma.TagFindManyArgs = {
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

    const tags = await prisma.tag.findMany(query);

    return ok(tags, '获取标签列表成功');
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return internalError('获取标签列表失败');
  }
}

// 创建标签（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = TagCreateSchema.parse(json ?? {});
    const { name, slug } = parsed;
    const normalizedSlug = (slug || name).toLowerCase().replace(/\s+/g, '-');

    const exists = await prisma.tag.findFirst({
      where: { OR: [{ name }, { slug: normalizedSlug }] },
    });
    if (exists) {
      return fail(400, '标签已存在');
    }

    const tag = await prisma.tag.create({ data: { name, slug: normalizedSlug } });

    return ok(tag, '创建标签成功');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误');
    }
    console.error('创建标签失败:', err);
    return internalError('创建标签失败');
  }
}

// 更新标签（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = TagUpdateSchema.parse(json ?? {});
    const { id, name, slug } = parsed;
    const normalizedSlug = (slug || name).toLowerCase().replace(/\s+/g, '-');

    const exists = await prisma.tag.findFirst({
      where: {
        OR: [{ name }, { slug: normalizedSlug }],
        NOT: { id },
      },
    });
    if (exists) {
      return fail(400, '标签名或Slug已被使用');
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: { name, slug: normalizedSlug },
    });

    return ok(updated, '更新标签成功');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误');
    }
    console.error('更新标签失败:', err);
    return internalError('更新标签失败');
  }
}

// 删除标签（仅管理员，查询参数传入id）
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    TagDeleteSchema.parse({ id });

    const exist = await prisma.tag.findUnique({ where: { id: id! } });
    if (!exist) {
      return fail(400, '标签不存在');
    }

    await prisma.tag.delete({ where: { id: id! } });
    return ok(null, '删除标签成功');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误');
    }
    console.error('删除标签失败:', err);
    return internalError('删除标签失败');
  }
}
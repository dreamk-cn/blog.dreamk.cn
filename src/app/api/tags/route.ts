import { fail, internalError, ok, zodFail } from '@/libs/api-response';
import { requireAdmin } from '@/libs/route-auth';
import { TagCreateSchema, TagUpdateSchema, TagDeleteSchema } from '@/schemas/tag';
import { createTag, deleteTag, listTags, updateTag } from '@/services/tag-service';
import z from 'zod';
import { NextRequest } from 'next/server';

// 获取标签列表（支持keyword搜索）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const keyword = searchParams.get('keyword') || '';
    const tags = await listTags(keyword);

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
    const result = await createTag(parsed);
    if (result.error) return fail(400, result.error);
    return ok(result.data, '创建标签成功');
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
    const result = await updateTag(parsed);
    if (result.error) return fail(400, result.error);
    return ok(result.data, '更新标签成功');
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
    const result = await deleteTag(id!);
    if (result.error) return fail(400, result.error);
    return ok(result.data, '删除标签成功');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误');
    }
    console.error('删除标签失败:', err);
    return internalError('删除标签失败');
  }
}
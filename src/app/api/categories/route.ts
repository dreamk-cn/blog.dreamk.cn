import { fail, internalError, ok, zodFail } from '@/libs/api-response';
import { requireAdmin } from '@/libs/route-auth';
import { CategoryCreateSchema, CategoryUpdateSchema, CategoryDeleteSchema } from '@/schemas/category';
import { createCategory, deleteCategory, listCategories, updateCategory } from '@/services/category-service';
import z from 'zod';
import { NextRequest } from 'next/server';

// 获取分类列表（支持keyword搜索）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const keyword = searchParams.get('keyword') || '';
    const categories = await listCategories(keyword);

    return ok(categories, '获取分类列表成功');
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return internalError('获取分类列表失败');
  }
}

// 创建分类（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = CategoryCreateSchema.parse(json ?? {});
    const result = await createCategory(parsed);
    if (result.error) return fail(400, result.error);
    return ok(result.data, '创建分类成功');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误');
    }
    console.error('创建分类失败:', err);
    return internalError('创建分类失败');
  }
}

// 更新分类（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = CategoryUpdateSchema.parse(json ?? {});
    const result = await updateCategory(parsed);
    if (result.error) return fail(400, result.error);
    return ok(result.data, '更新分类成功');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误');
    }
    console.error('更新分类失败:', err);
    return internalError('更新分类失败');
  }
}

// 删除分类（仅管理员，查询参数传入id）
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    CategoryDeleteSchema.parse({ id });
    const result = await deleteCategory(id!);
    if (result.error) return fail(400, result.error);
    return ok(result.data, '删除分类成功');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || '参数错误');
    }
    console.error('删除分类失败:', err);
    return internalError('删除分类失败');
  }
}
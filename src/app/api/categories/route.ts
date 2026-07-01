import { ResponseCode } from '@/config/response-code';
import { fail, ok } from '@/lib/api-response';
import { revalidateTaxonomyWriteCaches } from '@/lib/public-cache';
import { parseJson, withAdmin, withRoute } from '@/lib/route-handler';
import { CategoryCreateSchema, CategoryUpdateSchema, CategoryDeleteSchema } from '@/schemas/category';
import { createCategory, deleteCategory, listCategories, updateCategory } from '@/services/category-service';
import { NextResponse, type NextRequest } from 'next/server';

export const GET = withRoute(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get('keyword') || '';
  const categories = await listCategories(keyword);
  return ok(categories, '获取分类列表成功');
}, '获取分类列表失败');

export const POST = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;
  const parsed = CategoryCreateSchema.parse(json ?? {});
  const result = await createCategory(parsed);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  revalidateTaxonomyWriteCaches('categories', [result.data.slug]);
  return ok(result.data, '创建分类成功');
}, '创建分类失败');

export const PUT = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;
  const parsed = CategoryUpdateSchema.parse(json ?? {});
  const result = await updateCategory(parsed);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  revalidateTaxonomyWriteCaches('categories', [result.previousSlug, result.data.slug]);
  return ok(result.data, '更新分类成功');
}, '更新分类失败');

export const DELETE = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  CategoryDeleteSchema.parse({ id });
  const result = await deleteCategory(id!);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  revalidateTaxonomyWriteCaches('categories', [result.data.slug]);
  return ok(result.data, '删除分类成功');
}, '删除分类失败');

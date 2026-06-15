import { ResponseCode } from '@/config/response-code';
import { fail, ok } from '@/lib/api-response';
import { revalidateTaxonomyWriteCaches } from '@/lib/public-cache';
import { parseJson, withAdmin, withRoute } from '@/lib/route-handler';
import { TagCreateSchema, TagUpdateSchema, TagDeleteSchema } from '@/schemas/tag';
import { createTag, deleteTag, listTags, updateTag } from '@/services/tag-service';
import { NextResponse, type NextRequest } from 'next/server';

export const GET = withRoute(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get('keyword') || '';
  const tags = await listTags(keyword);
  return ok(tags, '获取标签列表成功');
}, '获取标签列表失败');

export const POST = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;
  const parsed = TagCreateSchema.parse(json ?? {});
  const result = await createTag(parsed);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  revalidateTaxonomyWriteCaches('tags', [result.data.slug]);
  return ok(result.data, '创建标签成功');
}, '创建标签失败');

export const PUT = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;
  const parsed = TagUpdateSchema.parse(json ?? {});
  const result = await updateTag(parsed);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  revalidateTaxonomyWriteCaches('tags', [result.previousSlug, result.data.slug]);
  return ok(result.data, '更新标签成功');
}, '更新标签失败');

export const DELETE = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  TagDeleteSchema.parse({ id });
  const result = await deleteTag(id!);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  revalidateTaxonomyWriteCaches('tags', [result.data.slug]);
  return ok(result.data, '删除标签成功');
}, '删除标签失败');

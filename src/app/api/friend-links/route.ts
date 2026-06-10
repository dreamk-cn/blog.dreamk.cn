import { ResponseCode } from "@/config/response-code";
import { fail, ok } from "@/lib/api-response";
import { parseJson, withAdmin } from "@/lib/route-handler";
import {
  FriendLinkCreateSchema,
  FriendLinkDeleteSchema,
  FriendLinkListQuerySchema,
  FriendLinkUpdateSchema,
} from "@/schemas/friend-link";
import {
  createFriendLink,
  deleteFriendLink,
  listFriendLinks,
  updateFriendLink,
} from "@/services/friend-link-service";
import { NextResponse } from "next/server";

export const GET = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl;
  const parsed = FriendLinkListQuerySchema.parse({
    keyword: searchParams.get("keyword") || undefined,
    status: searchParams.get("status") || undefined,
  });
  const links = await listFriendLinks(parsed);
  return ok(links, "获取友链列表成功");
}, "获取友链列表失败");

export const POST = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;
  const parsed = FriendLinkCreateSchema.parse(json ?? {});
  const result = await createFriendLink(parsed);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  return ok(result.data, "创建友链成功");
}, "创建友链失败");

export const PUT = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;
  const parsed = FriendLinkUpdateSchema.parse(json ?? {});
  const result = await updateFriendLink(parsed);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  return ok(result.data, "更新友链成功");
}, "更新友链失败");

export const DELETE = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  FriendLinkDeleteSchema.parse({ id });
  const result = await deleteFriendLink(id!);
  if (result.error) return fail(ResponseCode.FAIL, result.error);
  return ok(result.data, "删除友链成功");
}, "删除友链失败");

import { fail, internalError, ok, zodFail } from "@/libs/api-response";
import { requireAdmin } from "@/libs/route-auth";
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
import { NextRequest } from "next/server";
import z from "zod";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = request.nextUrl;
    const parsed = FriendLinkListQuerySchema.parse({
      keyword: searchParams.get("keyword") || undefined,
      status: searchParams.get("status") || undefined,
    });

    const links = await listFriendLinks(parsed);
    return ok(links, "获取友链列表成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("获取友链列表失败:", err);
    return internalError("获取友链列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = FriendLinkCreateSchema.parse(json ?? {});
    const result = await createFriendLink(parsed);
    if (result.error) return fail(400, result.error);
    return ok(result.data, "创建友链成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("创建友链失败:", err);
    return internalError("创建友链失败");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = FriendLinkUpdateSchema.parse(json ?? {});
    const result = await updateFriendLink(parsed);
    if (result.error) return fail(400, result.error);
    return ok(result.data, "更新友链成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("更新友链失败:", err);
    return internalError("更新友链失败");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    FriendLinkDeleteSchema.parse({ id });

    const result = await deleteFriendLink(id!);
    if (result.error) return fail(400, result.error);
    return ok(result.data, "删除友链成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("删除友链失败:", err);
    return internalError("删除友链失败");
  }
}

import { fail, internalError, ok, zodFail } from "@/lib/api-response";
import { requireAdmin } from "@/lib/route-auth";
import { MediaDeleteSchema, MediaListSchema } from "@/schemas/media";
import { deleteMediaFile, listMediaFiles } from "@/services/media-file-service";
import { type NextRequest } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  try {
    const parsed = MediaListSchema.parse({
      pageNo: searchParams.get("pageNo"),
      pageSize: searchParams.get("pageSize"),
      keyword: searchParams.get("keyword"),
      sortOrder: searchParams.get("sortOrder"),
      category: searchParams.get("category"),
      source: searchParams.get("source"),
      sortBy: searchParams.get("sortBy"),
    });

    const { list, total } = await listMediaFiles({
      pageNo: parsed.pageNo,
      pageSize: parsed.pageSize,
      keyword: parsed.keyword || undefined,
      category: parsed.category,
      source: parsed.source,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    });

    return ok(
      {
        list,
        total,
        pageNo: parsed.pageNo,
        pageSize: parsed.pageSize,
      },
      "获取文件列表成功",
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("admin media list error", err);
    return internalError();
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const parsed = MediaDeleteSchema.parse({ id: searchParams.get("id") });
    const result = await deleteMediaFile(parsed.id);

    if ("error" in result) {
      const status = "usageCount" in result && result.usageCount ? 409 : 400;
      return fail(status, result.error);
    }

    return ok({ success: true }, "删除成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("admin media delete error", err);
    return internalError();
  }
}

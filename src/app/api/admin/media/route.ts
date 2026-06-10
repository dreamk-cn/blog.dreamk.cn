import { ResponseCode } from "@/config/response-code";
import { conflict, fail, ok } from "@/lib/api-response";
import { withAdmin } from "@/lib/route-handler";
import { MediaDeleteSchema, MediaListSchema } from "@/schemas/media";
import { deleteMediaFile, listMediaFiles } from "@/services/media-file-service";

export const GET = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl;
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
}, "获取文件列表失败");

export const DELETE = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl;
  const parsed = MediaDeleteSchema.parse({ id: searchParams.get("id") });
  const result = await deleteMediaFile(parsed.id);

  if ("error" in result) {
    if ("usageCount" in result && result.usageCount) {
      return conflict(result.error);
    }
    return fail(ResponseCode.FAIL, result.error);
  }

  return ok({ success: true }, "删除成功");
}, "删除媒体文件失败");

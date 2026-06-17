import { ResponseCode } from "@/config/response-code";
import { conflict, fail, internalError, ok } from "@/lib/api-response";
import { extensionFromMime } from "@/lib/oss";
import { withAdmin } from "@/lib/route-handler";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  getMaxFileSizeBytes,
  MediaDeleteSchema,
  MediaListSchema,
  MediaReplaceIdSchema,
} from "@/schemas/media";
import {
  deleteMediaFile,
  listMediaFiles,
  replaceUploadedMediaFile,
} from "@/services/media-file-service";

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

function mapOssConfigError(err: unknown) {
  if (err instanceof Error && err.message.startsWith("缺少 OSS")) {
    return internalError(err.message);
  }
  return null;
}

export const PATCH = withAdmin(async (request) => {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return fail(ResponseCode.FAIL, "仅支持站内上传文件替换");
  }

  const formData = await request.formData();
  const { id } = MediaReplaceIdSchema.parse({ id: formData.get("id") });
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return fail(ResponseCode.FAIL, "请上传文件");
  }

  const mimeType = file.type;
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return fail(ResponseCode.FAIL, "仅支持 JPEG、PNG、WebP、GIF 图片");
  }

  const maxSize = getMaxFileSizeBytes();
  if (file.size > maxSize) {
    return fail(ResponseCode.FAIL, `文件大小不能超过 ${Math.floor(maxSize / 1024 / 1024)}MB`);
  }

  const extension = extensionFromMime(mimeType);
  if (!extension) {
    return fail(ResponseCode.FAIL, "不支持的图片类型");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await replaceUploadedMediaFile({
    id,
    originalName: file.name,
    mimeType,
    size: file.size,
    buffer,
  });

  if ("error" in result) {
    return fail(ResponseCode.FAIL, result.error);
  }

  return ok(result.data, "替换成功");
}, { logLabel: "替换媒体文件失败", mapError: mapOssConfigError });

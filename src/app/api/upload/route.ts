import { ResponseCode } from "@/config/response-code";
import { fail, internalError, ok } from "@/lib/api-response";
import { mapPrismaError } from "@/lib/prisma-errors";
import { extensionFromMime, uploadImage, type OssUploadCategory } from "@/lib/oss";
import { requireAdmin } from "@/lib/route-auth";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  getMaxFileSizeBytes,
  uploadCategoryToMediaCategory,
} from "@/schemas/media";
import { createMediaFile } from "@/services/media-file-service";

function parseUploadCategory(value: FormDataEntryValue | null): OssUploadCategory {
  const raw = String(value ?? "asset");
  if (raw === "covers" || raw === "images") return raw;
  return "asset";
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const formData = await request.formData();
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

    const category = parseUploadCategory(formData.get("category"));
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImage(buffer, { category, contentType: mimeType, extension });

    const mediaFile = await createMediaFile({
      source: "UPLOAD",
      key: uploaded.key,
      url: uploaded.url,
      originalName: file.name,
      mimeType,
      size: file.size,
      category: uploadCategoryToMediaCategory(category),
      userId: admin.session.user.id as string,
    });

    return ok(
      {
        id: mediaFile.id,
        url: mediaFile.url,
        key: uploaded.key,
        originalName: mediaFile.originalName,
        size: file.size,
        source: "UPLOAD",
        category: mediaFile.category,
      },
      "上传成功",
    );
  } catch (error) {
    console.error("上传文件失败:", error);
    if (error instanceof Error && error.message.startsWith("缺少 OSS")) {
      return internalError(error.message);
    }
    const prismaErr = mapPrismaError(error);
    if (prismaErr) return prismaErr;
    return internalError("上传失败");
  }
}

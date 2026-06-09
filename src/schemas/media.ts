import z from "zod";
import zValue from ".";
import { SearchPageSchema } from "./page";

export const ExternalMediaSchema = z.object({
  url: zValue(
    z
      .url("外链格式不正确")
      .max(1024, "外链不能超过 1024 个字符")
      .refine((value) => /^https?:\/\//i.test(value), "外链须为 http(s):// 地址"),
  ),
  category: zValue(z.enum(["asset", "covers", "images"]).default("asset")),
});

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const DEFAULT_MAX_FILE_SIZE_MB = 5;

export function getMaxFileSizeBytes() {
  const configured = Number(process.env.OSS_MAX_FILE_SIZE_MB);
  const mb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_FILE_SIZE_MB;
  return mb * 1024 * 1024;
}

export function uploadCategoryToMediaCategory(category: "asset" | "covers" | "images") {
  if (category === "covers") return "COVER" as const;
  if (category === "images") return "CONTENT" as const;
  return "ASSET" as const;
}

export const MediaListSchema = SearchPageSchema.extend({
  category: zValue(z.enum(["ALL", "ASSET", "COVER", "CONTENT"]).default("ALL")),
  source: zValue(z.enum(["ALL", "UPLOAD", "EXTERNAL"]).default("ALL")),
  sortBy: zValue(z.enum(["createdAt", "size"]).default("createdAt")),
});

export const MediaDeleteSchema = z.object({
  id: zValue(z.string().min(1, "缺少文件 ID")),
});

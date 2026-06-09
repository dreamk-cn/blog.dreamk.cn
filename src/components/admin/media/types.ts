import type { MediaCategory, MediaSource } from "@/generated/prisma";

export type MediaViewMode = "table" | "grid";

export type MediaListItem = {
  id: string;
  url: string;
  source: MediaSource;
  category: MediaCategory;
  originalName: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
  usageCount: number;
};

export type MediaListResponse = {
  list: MediaListItem[];
  total: number;
  pageNo: number;
  pageSize: number;
};

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  ASSET: "通用",
  COVER: "封面",
  CONTENT: "正文",
};

export const MEDIA_SOURCE_LABELS: Record<MediaSource, string> = {
  UPLOAD: "本地上传",
  EXTERNAL: "外链",
};

export function formatFileSize(size: number | null) {
  if (size == null) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMediaDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getMediaDisplayName(item: MediaListItem) {
  return item.originalName?.trim() || item.url.split("/").pop() || item.url;
}

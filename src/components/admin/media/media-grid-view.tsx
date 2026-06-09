"use client";

import { Chip, Spinner } from "@heroui/react";
import { MediaActions } from "@/components/admin/media/media-actions";
import { MediaThumbnail } from "@/components/admin/media/media-thumbnail";
import {
  formatFileSize,
  formatMediaDate,
  getMediaDisplayName,
  MEDIA_CATEGORY_LABELS,
  MEDIA_SOURCE_LABELS,
  type MediaListItem,
} from "@/components/admin/media/types";

type MediaGridViewProps = {
  items: MediaListItem[];
  loading: boolean;
  error: string | null;
  deletingId: string | null;
  onPreview: (item: MediaListItem) => void;
  onDelete: (item: MediaListItem) => void;
};

export function MediaGridView({
  items,
  loading,
  error,
  deletingId,
  onPreview,
  onDelete,
}: MediaGridViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner color="accent" aria-label="加载中" />
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-red-500">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-text-muted">暂无数据</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm"
        >
          <button
            type="button"
            className="relative aspect-[4/3] w-full bg-canvas"
            onClick={() => onPreview(item)}
          >
            <MediaThumbnail
              url={item.url}
              alt={getMediaDisplayName(item)}
              sizes="(max-width: 640px) 50vw, 240px"
            />
          </button>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <p className="line-clamp-1 text-sm font-medium text-text-base">{getMediaDisplayName(item)}</p>
            <div className="flex flex-wrap gap-1">
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>{MEDIA_CATEGORY_LABELS[item.category]}</Chip.Label>
              </Chip>
              <Chip size="sm" variant="soft">
                <Chip.Label>{MEDIA_SOURCE_LABELS[item.source]}</Chip.Label>
              </Chip>
            </div>
            <p className="text-xs text-text-muted">
              {formatFileSize(item.size)} · 引用 {item.usageCount}
            </p>
            <p className="text-xs text-text-sub">{formatMediaDate(item.createdAt)}</p>
            <MediaActions
              item={item}
              compact
              deleting={deletingId === item.id}
              onPreview={onPreview}
              onDelete={onDelete}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

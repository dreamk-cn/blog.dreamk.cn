"use client";

import { Button, Chip, Spinner } from "@heroui/react";
import { MediaThumbnail } from "@/components/admin/media/media-thumbnail";
import {
  formatFileSize,
  getMediaDisplayName,
  MEDIA_CATEGORY_LABELS,
  MEDIA_SOURCE_LABELS,
  type MediaListItem,
} from "@/components/admin/media/types";

type MediaPickerGridProps = {
  items: MediaListItem[];
  loading: boolean;
  onSelect: (item: MediaListItem) => void;
  onPreview: (item: MediaListItem) => void;
};

export function MediaPickerGrid({ items, loading, onSelect, onPreview }: MediaPickerGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner color="accent" aria-label="加载中" />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">暂无匹配媒体，可调整筛选或上传新图</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-colors hover:border-primary"
        >
          <button
            type="button"
            className="relative aspect-[4/3] w-full bg-canvas"
            onClick={() => onSelect(item)}
            title="点击插入"
          >
            <MediaThumbnail
              url={item.url}
              alt={getMediaDisplayName(item)}
              sizes="(max-width: 640px) 50vw, 200px"
            />
          </button>
          <div className="flex flex-1 flex-col gap-1.5 p-2">
            <p className="line-clamp-1 text-xs font-medium text-text-base">{getMediaDisplayName(item)}</p>
            <div className="flex flex-wrap gap-1">
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>{MEDIA_CATEGORY_LABELS[item.category]}</Chip.Label>
              </Chip>
              <Chip size="sm" variant="soft">
                <Chip.Label>{MEDIA_SOURCE_LABELS[item.source]}</Chip.Label>
              </Chip>
            </div>
            <p className="text-xs text-text-muted">{formatFileSize(item.size)}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-auto self-start"
              onPress={() => onPreview(item)}
            >
              预览
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

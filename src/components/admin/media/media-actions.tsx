"use client";

import { Button, toast } from "@heroui/react";
import type { MediaListItem } from "@/components/admin/media/types";

type MediaActionsProps = {
  item: MediaListItem;
  deleting?: boolean;
  replacing?: boolean;
  compact?: boolean;
  onPreview: (item: MediaListItem) => void;
  onReplace?: (item: MediaListItem) => void;
  onDelete: (item: MediaListItem) => void;
};

export async function copyMediaUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast("链接已复制");
  } catch {
    toast("复制失败，请手动复制");
  }
}

export function MediaActions({
  item,
  deleting,
  replacing,
  compact,
  onPreview,
  onReplace,
  onDelete,
}: MediaActionsProps) {
  const busy = deleting || replacing;

  return (
    <div className={`flex ${compact ? "flex-row gap-1 flex-wrap" : "gap-2"}`}>
      <Button size="sm" variant="secondary" onPress={() => onPreview(item)}>
        预览
      </Button>
      {item.source === "UPLOAD" && onReplace ? (
        <Button
          size="sm"
          variant="secondary"
          isDisabled={busy}
          onPress={() => onReplace(item)}
        >
          替换
        </Button>
      ) : null}
      <Button size="sm" variant="secondary" onPress={() => void copyMediaUrl(item.url)}>
        复制链接
      </Button>
      <Button
        size="sm"
        variant="danger"
        isDisabled={busy}
        isPending={deleting}
        onPress={() => onDelete(item)}
      >
        {deleting ? "删除中..." : "删除"}
      </Button>
    </div>
  );
}

"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { copyMediaUrl } from "@/components/admin/media/media-actions";
import { MediaThumbnail } from "@/components/admin/media/media-thumbnail";
import {
  formatFileSize,
  formatMediaDate,
  getMediaDisplayName,
  MEDIA_CATEGORY_LABELS,
  MEDIA_SOURCE_LABELS,
  type MediaListItem,
} from "@/components/admin/media/types";

type ModalState = ReturnType<typeof useOverlayState>;

type MediaPreviewModalProps = {
  state: ModalState;
  item: MediaListItem | null;
};

export function MediaPreviewModal({ state, item }: MediaPreviewModalProps) {
  if (!item) return null;

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl bg-canvas inset-ring-primary inset-ring-2">
            <Modal.Header>
              <Modal.Heading className="text-text-base">文件预览</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 p-2">
              <div className="relative mx-auto aspect-video w-full max-h-[360px] overflow-hidden rounded-xl bg-canvas">
                <MediaThumbnail
                  url={item.url}
                  alt={getMediaDisplayName(item)}
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-text-muted">文件名</dt>
                <dd className="break-all text-text-base">{getMediaDisplayName(item)}</dd>
                <dt className="text-text-muted">URL</dt>
                <dd className="break-all text-text-base">{item.url}</dd>
                <dt className="text-text-muted">分类</dt>
                <dd className="text-text-base">{MEDIA_CATEGORY_LABELS[item.category]}</dd>
                <dt className="text-text-muted">来源</dt>
                <dd className="text-text-base">{MEDIA_SOURCE_LABELS[item.source]}</dd>
                <dt className="text-text-muted">大小</dt>
                <dd className="text-text-base">{formatFileSize(item.size)}</dd>
                <dt className="text-text-muted">上传时间</dt>
                <dd className="text-text-base">{formatMediaDate(item.createdAt)}</dd>
                <dt className="text-text-muted">引用数</dt>
                <dd className="text-text-base">{item.usageCount}</dd>
              </dl>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" onPress={state.close}>
                关闭
              </Button>
              <Button variant="primary" onPress={() => void copyMediaUrl(item.url)}>
                复制链接
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { getMediaDisplayName, type MediaListItem } from "@/components/admin/media/types";

type ModalState = ReturnType<typeof useOverlayState>;

type MediaDeleteModalProps = {
  state: ModalState;
  item: MediaListItem | null;
  deleting: boolean;
  onConfirm: () => void;
};

export function MediaDeleteModal({ state, item, deleting, onConfirm }: MediaDeleteModalProps) {
  if (!item) return null;

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="bg-canvas inset-ring-error inset-ring-2">
            <Modal.Header>
              <Modal.Heading className="text-text-base">确认删除</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-text-base">
                确定删除「{getMediaDisplayName(item)}」吗？
              </p>
              {item.source === "UPLOAD" ? (
                <p className="mt-2 text-xs text-text-muted">
                  本地上传的文件将同时从 OSS 中删除，此操作不可恢复。
                </p>
              ) : (
                <p className="mt-2 text-xs text-text-muted">外链记录将从媒体库中移除。</p>
              )}
              {item.usageCount > 0 ? (
                <p className="mt-2 text-sm text-red-500">
                  该文件正在被 {item.usageCount} 篇文章引用，无法删除。
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" onPress={state.close}>
                取消
              </Button>
              <Button
                variant="danger"
                isDisabled={item.usageCount > 0 || deleting}
                isPending={deleting}
                onPress={onConfirm}
              >
                {deleting ? "删除中..." : "确认删除"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

"use client";

import { useRef } from "react";
import { Button, Label, Modal, toast, useOverlayState } from "@heroui/react";
import { MediaThumbnail } from "@/components/admin/media/media-thumbnail";
import { getMediaDisplayName, type MediaListItem } from "@/components/admin/media/types";
import { request } from "@/lib/request";

type ModalState = ReturnType<typeof useOverlayState>;

type MediaReplaceModalProps = {
  state: ModalState;
  item: MediaListItem | null;
  replacing: boolean;
  onReplacingChange: (replacing: boolean) => void;
  onReplaced: () => void;
};

export function MediaReplaceModal({
  state,
  item,
  replacing,
  onReplacingChange,
  onReplaced,
}: MediaReplaceModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!item || item.source !== "UPLOAD") return null;
  const currentItem = item;

  async function handleReplace(file: File) {
    const formData = new FormData();
    formData.append("id", currentItem.id);
    formData.append("file", file);

    onReplacingChange(true);
    try {
      const response = await request.patchUpload("/admin/media", formData, {
        showSuccessMessage: false,
      });
      if (response.code === 200) {
        toast.success("替换成功", {
          description:
            "链接地址不变。若预览仍显示旧图，可能是 CDN 或浏览器缓存，请稍后刷新或强制刷新页面。",
        });
        onReplaced();
        state.close();
      }
    } finally {
      onReplacingChange(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void handleReplace(file);
  }

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="bg-canvas inset-ring-primary inset-ring-2">
            <Modal.Header>
              <Modal.Heading className="text-text-base">替换文件</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-canvas">
                  <MediaThumbnail
                    url={currentItem.url}
                    alt={getMediaDisplayName(currentItem)}
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-base">
                    {getMediaDisplayName(currentItem)}
                  </p>
                  <p className="truncate text-xs text-text-muted">{currentItem.url}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-text-muted">选择新图片覆盖原文件</Label>
                <p className="text-xs text-text-muted">
                  替换后链接地址保持不变，已引用该图片的文章将自动显示新内容。
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void handleFileChange(event)}
                />
                <Button
                  type="button"
                  variant="primary"
                  isDisabled={replacing}
                  isPending={replacing}
                  onPress={() => inputRef.current?.click()}
                >
                  {replacing ? "替换中..." : "选择并替换"}
                </Button>
              </div>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" isDisabled={replacing} onPress={state.close}>
                取消
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Button, Label, Modal, Tabs, useOverlayState } from "@heroui/react";
import { MediaPickerPanel } from "@/components/admin/media/media-picker-panel";
import type { MediaCategoryFilter } from "@/components/admin/media/media-toolbar";
import { ExternalMediaInput } from "@/components/ui/external-media-input";
import { ImageUploader } from "@/components/ui/image-uploader";

type ModalState = ReturnType<typeof useOverlayState>;

export type MediaPickerModalProps = {
  state: ModalState;
  title?: string;
  uploadCategory: "images" | "covers";
  initialCategoryFilter?: MediaCategoryFilter;
  onSelect: (media: { id: string; url: string }) => void;
};

export function MediaPickerModal({
  state,
  title = "选择媒体",
  uploadCategory,
  initialCategoryFilter = "ALL",
  onSelect,
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<string>("library");

  function handleSelect(media: { id: string; url: string }) {
    onSelect(media);
    state.close();
  }

  function switchToUpload() {
    setActiveTab("upload");
  }

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-4xl bg-canvas inset-ring-primary inset-ring-2">
            <Modal.Header>
              <Modal.Heading className="text-text-base">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 p-2">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(String(key))}
              >
                <Tabs.ListContainer>
                  <Tabs.List aria-label="媒体选择方式">
                    <Tabs.Tab id="library" className="text-text-base">
                      媒体库
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="upload" className="text-text-base">
                      上传
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>

                <Tabs.Panel id="library" className="pt-3">
                  <MediaPickerPanel
                    initialCategoryFilter={initialCategoryFilter}
                    onSelect={handleSelect}
                    onGoUpload={switchToUpload}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="upload" className="space-y-4 pt-3">
                  <Tabs defaultSelectedKey="upload-file">
                    <Tabs.ListContainer>
                      <Tabs.List aria-label="上传方式">
                        <Tabs.Tab id="upload-file" className="text-text-base">
                          本地上传
                          <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab id="upload-external" className="text-text-base">
                          登记外链
                          <Tabs.Indicator />
                        </Tabs.Tab>
                      </Tabs.List>
                    </Tabs.ListContainer>

                    <Tabs.Panel id="upload-file" className="space-y-2 pt-3">
                      <Label className="text-text-muted">选择图片文件</Label>
                      <ImageUploader
                        category={uploadCategory}
                        label="选择并上传"
                        onUploaded={(media) => handleSelect(media)}
                      />
                    </Tabs.Panel>

                    <Tabs.Panel id="upload-external" className="space-y-2 pt-3">
                      <Label className="text-text-muted">图片外链地址</Label>
                      <ExternalMediaInput
                        category={uploadCategory}
                        label="登记并插入"
                        onRegistered={(media) => handleSelect(media)}
                      />
                    </Tabs.Panel>
                  </Tabs>
                </Tabs.Panel>
              </Tabs>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" onPress={state.close}>
                关闭
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Button, Label, Modal, Tabs, useOverlayState } from "@heroui/react";
import { StringSelect } from "@/components/admin/string-select";
import { ExternalMediaInput } from "@/components/ui/external-media-input";
import { ImageUploader } from "@/components/ui/image-uploader";

type UploadCategory = "asset" | "covers" | "images";

type ModalState = ReturnType<typeof useOverlayState>;

type MediaUploadModalProps = {
  state: ModalState;
  onUploaded: () => void;
};

export function MediaUploadModal({ state, onUploaded }: MediaUploadModalProps) {
  const [category, setCategory] = useState<UploadCategory>("asset");

  function handleSuccess() {
    onUploaded();
  }

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="bg-canvas inset-ring-primary inset-ring-2">
            <Modal.Header>
              <Modal.Heading className="text-text-base">上传文件</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 p-2">
              <StringSelect
                className="w-full text-text-muted"
                label="文件分类"
                selectedId={category}
                onSelectionChange={(id) => setCategory(id as UploadCategory)}
                options={[
                  { id: "asset", label: "通用" },
                  { id: "covers", label: "封面" },
                  { id: "images", label: "正文" },
                ]}
              />

              <Tabs defaultSelectedKey="upload">
                <Tabs.ListContainer>
                  <Tabs.List aria-label="上传方式">
                    <Tabs.Tab id="upload" className="text-text-base">
                      本地上传
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="external" className="text-text-base">
                      登记外链
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>

                <Tabs.Panel id="upload" className="space-y-2 pt-3">
                  <Label className="text-text-muted">选择图片文件</Label>
                  <ImageUploader
                    category={category}
                    label="选择并上传"
                    onUploaded={() => {
                      handleSuccess();
                      state.close();
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="external" className="space-y-2 pt-3">
                  <Label className="text-text-muted">图片外链地址</Label>
                  <ExternalMediaInput
                    category={category}
                    label="登记外链"
                    onRegistered={() => {
                      handleSuccess();
                      state.close();
                    }}
                  />
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

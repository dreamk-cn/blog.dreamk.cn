'use client';

import Image from "next/image";
import { Button, Description, Label, Tabs } from "@heroui/react";
import { ExternalMediaInput } from "@/components/ui/external-media-input";
import { ImageUploader, type UploadedMedia } from "@/components/ui/image-uploader";
import { isRemoteCoverSrc, POST_COVER_PLACEHOLDER_PATH } from "@/lib/post-cover";

export type CoverPreviewItem = {
  id: string;
  url: string;
};

type PostCoverManagerProps = {
  items: CoverPreviewItem[];
  disabled?: boolean;
  onChange: (items: CoverPreviewItem[]) => void;
};

export function PostCoverManager({ items, disabled, onChange }: PostCoverManagerProps) {
  function appendMedia(media: UploadedMedia) {
    if (items.some((item) => item.id === media.id)) return;
    onChange([...items, media]);
  }

  function removeAt(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-text-muted">文章封面</Label>
        <Description>支持多张封面；首张用于列表展示。可上传或登记外链，也可复用已有媒体资产。</Description>
      </div>

      <Tabs defaultSelectedKey="upload">
        <Tabs.ListContainer>
          <Tabs.List aria-label="封面来源">
            <Tabs.Tab id="upload" className="text-text-base">
              上传封面
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="external" className="text-text-base">
              外链封面
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="upload" className="pt-3">
          <ImageUploader
            category="covers"
            label="添加封面"
            disabled={disabled}
            onUploaded={appendMedia}
          />
        </Tabs.Panel>

        <Tabs.Panel id="external" className="pt-3">
          <ExternalMediaInput
            category="covers"
            label="添加外链"
            disabled={disabled}
            onRegistered={appendMedia}
          />
        </Tabs.Panel>
      </Tabs>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-2"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-canvas">
                <Image
                  src={item.url}
                  alt={`封面 ${index + 1}`}
                  fill
                  sizes="96px"
                  unoptimized={isRemoteCoverSrc(item.url)}
                  className="object-cover object-center"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-base">
                  {index === 0 ? "首图（列表展示）" : `封面 ${index + 1}`}
                </p>
                <p className="truncate text-xs text-text-muted">{item.url}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  isDisabled={disabled || index === 0}
                  onPress={() => move(index, -1)}
                >
                  上移
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  isDisabled={disabled || index === items.length - 1}
                  onPress={() => move(index, 1)}
                >
                  下移
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  isDisabled={disabled}
                  onPress={() => removeAt(index)}
                >
                  移除
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-canvas">
          <p className="border-b border-border px-3 py-2 text-xs text-text-muted">封面预览</p>
          <div className="relative h-32 w-full sm:h-36">
            <Image
              src={POST_COVER_PLACEHOLDER_PATH}
              alt="暂无封面"
              fill
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-cover object-center"
            />
          </div>
        </div>
      )}
    </div>
  );
}

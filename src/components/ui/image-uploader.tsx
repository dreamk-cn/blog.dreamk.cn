'use client';

import { useRef, useState } from "react";
import { Button, toast } from "@heroui/react";
import { request, type HttpError } from "@/lib/request";

export type UploadedMedia = {
  id: string;
  url: string;
};

type ImageUploaderProps = {
  category: "covers" | "images" | "asset";
  label?: string;
  disabled?: boolean;
  onUploaded: (media: UploadedMedia) => void;
};

export function ImageUploader({
  category,
  label = "上传图片",
  disabled,
  onUploaded,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    setUploading(true);
    try {
      const response = await request.upload<UploadedMedia & { originalName?: string }>("/upload", formData, {
        showSuccessMessage: false,
      });

      if (!response.data?.id || !response.data.url) {
        toast("上传失败，请重试");
        return;
      }

      onUploaded({ id: response.data.id, url: response.data.url });
      toast("上传成功");
    } catch (error) {
      const message = (error as HttpError).message || "上传失败";
      toast(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        isDisabled={disabled || uploading}
        isPending={uploading}
        onPress={() => inputRef.current?.click()}
      >
        {uploading ? "上传中..." : label}
      </Button>
    </>
  );
}

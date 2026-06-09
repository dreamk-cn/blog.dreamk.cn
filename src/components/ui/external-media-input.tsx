'use client';

import { useState } from "react";
import { Button, Input, toast } from "@heroui/react";
import { request, type HttpError } from "@/lib/request";
import type { UploadedMedia } from "@/components/ui/image-uploader";

type ExternalMediaInputProps = {
  category: "covers" | "images" | "asset";
  label?: string;
  disabled?: boolean;
  onRegistered: (media: UploadedMedia) => void;
};

export function ExternalMediaInput({
  category,
  label = "登记外链",
  disabled,
  onRegistered,
}: ExternalMediaInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const trimmed = url.trim();
    if (!trimmed) {
      toast("请输入图片外链");
      return;
    }

    setLoading(true);
    try {
      const response = await request.post<UploadedMedia>("/media/external", {
        url: trimmed,
        category,
      }, { showSuccessMessage: false });

      if (!response.data?.id || !response.data.url) {
        toast("登记失败，请重试");
        return;
      }

      onRegistered({ id: response.data.id, url: response.data.url });
      setUrl("");
      toast("外链登记成功");
    } catch (error) {
      const message = (error as HttpError).message || "登记失败";
      toast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        className="text-text-base flex-1"
        placeholder="https://example.com/image.jpg"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        disabled={disabled || loading}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="shrink-0"
        isDisabled={disabled || loading}
        isPending={loading}
        onPress={() => void handleRegister()}
      >
        {loading ? "登记中..." : label}
      </Button>
    </div>
  );
}

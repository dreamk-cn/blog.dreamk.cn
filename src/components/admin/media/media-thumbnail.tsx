"use client";

import Image from "next/image";
import { isRemoteCoverSrc } from "@/lib/post-cover";

type MediaThumbnailProps = {
  url: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
};

export function MediaThumbnail({ url, alt, className, fill = true, sizes }: MediaThumbnailProps) {
  return (
    <Image
      src={url}
      alt={alt}
      fill={fill}
      sizes={sizes}
      unoptimized={isRemoteCoverSrc(url)}
      className={className ?? "object-cover object-center"}
    />
  );
}

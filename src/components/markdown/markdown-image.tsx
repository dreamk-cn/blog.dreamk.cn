"use client";

import clsx from "clsx";
import type { ImgHTMLAttributes } from "react";
import { withoutNodeProps } from "@/lib/markdown-react-props";
import { useMarkdownImageLightbox } from "./markdown-image-lightbox";

const variantClasses = {
  article:
    "mb-6 block max-w-full cursor-zoom-in rounded-xl border-0 bg-transparent p-0 text-left transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  comment:
    "my-2 block max-w-full cursor-zoom-in rounded-lg border-0 bg-transparent p-0 text-left transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
} as const;

const imgVariantClasses = {
  article:
    "h-auto max-w-full rounded-xl border border-default-200/60 object-contain dark:border-default-100/15",
  comment: "h-auto max-w-full rounded-lg object-contain",
} as const;

export type MarkdownImageVariant = keyof typeof variantClasses;

type MarkdownImageProps = {
  variant?: MarkdownImageVariant;
  className?: string;
  alt?: string;
  src?: string | Blob;
};

export function MarkdownImage({
  variant = "article",
  className,
  alt,
  src,
  ...props
}: MarkdownImageProps & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const domProps = withoutNodeProps(props as Record<string, unknown>);
  const lightbox = useMarkdownImageLightbox();
  const resolvedSrc = typeof src === "string" ? src : undefined;
  const resolvedAlt = alt ?? "";

  const imgClassName = clsx(imgVariantClasses[variant], className);

  if (!lightbox || !resolvedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={resolvedAlt}
        className={variant === "article" ? clsx(imgVariantClasses.article, "mb-6", className) : imgClassName}
        src={resolvedSrc}
        {...domProps}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={resolvedAlt ? `查看大图：${resolvedAlt}` : "查看大图"}
      className={variantClasses[variant]}
      data-md-lightbox-trigger
      onClick={() => lightbox.openImage(resolvedSrc)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={resolvedAlt}
        className={imgClassName}
        data-md-lightbox
        src={resolvedSrc}
        {...domProps}
      />
    </button>
  );
}

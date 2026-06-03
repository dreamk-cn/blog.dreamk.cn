import Image from "next/image";
import clsx from "clsx";
import { isRemoteCoverSrc, resolvePostCoverSrc } from "@/lib/post-cover";

export type PostCoverVariant = "card" | "hero" | "thumb";

/** 固定高度，避免 16:9 / 21:9 在宽屏下过高 */
const variantClass: Record<PostCoverVariant, string> = {
  card: "h-32 w-full sm:h-36",
  hero: "h-40 w-full sm:h-44",
  thumb: "h-24 w-full max-w-[200px] shrink-0",
};

const sizeHints: Record<PostCoverVariant, string> = {
  card: "(max-width: 1024px) 100vw, 720px",
  hero: "(max-width: 768px) 100vw, 768px",
  thumb: "200px",
};

type PostCoverProps = {
  coverUrl?: string | null;
  alt: string;
  variant?: PostCoverVariant;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function PostCover({
  coverUrl,
  alt,
  variant = "card",
  className,
  imageClassName,
  priority,
}: PostCoverProps) {
  const { src, isPlaceholder } = resolvePostCoverSrc(coverUrl);
  const useUnoptimized = isPlaceholder || isRemoteCoverSrc(src);

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-foreground",
        variantClass[variant],
        className,
      )}
    >
      <Image
        src={src}
        alt={isPlaceholder ? `${alt}（暂无封面）` : alt}
        fill
        sizes={sizeHints[variant]}
        priority={priority}
        unoptimized={useUnoptimized}
        className={clsx(
          "object-cover object-center",
          !isPlaceholder && "transition-transform duration-300 group-hover:scale-[1.02]",
          imageClassName,
        )}
      />
    </div>
  );
}

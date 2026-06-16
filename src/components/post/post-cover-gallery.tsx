'use client';

import Image from "next/image";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCoverUrls, isRemoteCoverSrc, resolvePostCoverSrc, type CoverMediaItem } from "@/lib/post-cover";
import { PostCover, type PostCoverVariant } from "@/components/post/post-cover";

type PostCoverGalleryProps = {
  coverMedia?: CoverMediaItem[] | null;
  alt: string;
  variant?: PostCoverVariant;
  className?: string;
  priority?: boolean;
};

const sizeHints: Record<PostCoverVariant, string> = {
  card: "(max-width: 1024px) 100vw, 720px",
  hero: "(max-width: 768px) 100vw, 768px",
  thumb: "200px",
};

const mainHeightClass: Record<PostCoverVariant, string> = {
  card: "h-32 sm:h-36",
  hero: "h-48 sm:h-56 md:h-64",
  thumb: "h-24",
};

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

type CoverCarouselProps = {
  urls: string[];
  alt: string;
  variant: PostCoverVariant;
  className?: string;
  priority?: boolean;
};

function CoverCarousel({ urls, alt, variant, className, priority }: CoverCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const showThumbnails = variant === "hero" && urls.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + urls.length) % urls.length);
    },
    [urls.length],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  useEffect(() => {
    const strip = thumbStripRef.current;
    const thumb = strip?.children[activeIndex] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const delta = touchStartX.current - endX;
    if (Math.abs(delta) < 48) return;
    if (delta > 0) goNext();
    else goPrev();
  };

  return (
    <div
      className={clsx("group/gallery flex flex-col", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${alt} 封面图集`}
    >
      <div
        className={clsx("relative overflow-hidden bg-canvas", mainHeightClass[variant])}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {urls.map((url, index) => {
          const { src } = resolvePostCoverSrc(url);
          const useUnoptimized = isRemoteCoverSrc(src);
          const isActive = index === activeIndex;

          return (
            <div
              key={`${url}-${index}`}
              className={clsx(
                "absolute inset-0 transition-opacity duration-500 ease-out",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={!isActive}
            >
              <Image
                src={src}
                alt={`${alt} 封面 ${index + 1}`}
                fill
                sizes={sizeHints[variant]}
                priority={priority && index === 0}
                unoptimized={useUnoptimized}
                className="object-cover object-center"
              />
            </div>
          );
        })}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 via-black/15 to-transparent"
          aria-hidden
        />

        <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {activeIndex + 1} / {urls.length}
        </div>

        {urls.length > 1 && (
          <>
            <button
              type="button"
              aria-label="上一张封面"
              onClick={goPrev}
              className={clsx(
                "absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full",
                "bg-black/40 text-white backdrop-blur-sm transition-all",
                "opacity-70 hover:bg-black/55 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                "sm:opacity-0 sm:group-hover/gallery:opacity-100 sm:size-10",
              )}
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="下一张封面"
              onClick={goNext}
              className={clsx(
                "absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full",
                "bg-black/40 text-white backdrop-blur-sm transition-all",
                "opacity-70 hover:bg-black/55 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                "sm:opacity-0 sm:group-hover/gallery:opacity-100 sm:size-10",
              )}
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </>
        )}

        {!showThumbnails && urls.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {urls.map((url, index) => (
              <button
                key={`dot-${url}-${index}`}
                type="button"
                aria-label={`切换到封面 ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                className={clsx(
                  "rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "size-2 bg-white shadow-sm"
                    : "size-1.5 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {showThumbnails && (
        <div
          ref={thumbStripRef}
          className="flex gap-2 overflow-x-auto border-t border-border bg-background/90 p-3"
        >
          {urls.map((url, index) => {
            const { src } = resolvePostCoverSrc(url);
            const useUnoptimized = isRemoteCoverSrc(src);
            const isActive = index === activeIndex;

            return (
              <button
                key={`thumb-${url}-${index}`}
                type="button"
                aria-label={`查看封面 ${index + 1}`}
                aria-current={isActive}
                onClick={() => goTo(index)}
                className={clsx(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all sm:h-16 sm:w-24",
                  isActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="96px"
                  unoptimized={useUnoptimized}
                  className="object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PostCoverGallery({
  coverMedia,
  alt,
  variant = "hero",
  className,
  priority,
}: PostCoverGalleryProps) {
  const urls = getCoverUrls(coverMedia);

  if (urls.length <= 1) {
    return (
      <PostCover
        coverUrl={urls[0]}
        alt={alt}
        variant={variant}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <CoverCarousel
      urls={urls}
      alt={alt}
      variant={variant}
      className={className}
      priority={priority}
    />
  );
}

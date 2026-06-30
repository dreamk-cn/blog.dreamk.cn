"use client";

import clsx from "clsx";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon } from "@/components/icons";

export type MarkdownLightboxImage = {
  src: string;
  alt: string;
};

type MarkdownImageLightboxContextValue = {
  openImage: (src: string) => void;
};

const MarkdownImageLightboxContext = createContext<MarkdownImageLightboxContextValue | null>(null);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

export function useMarkdownImageLightbox() {
  return useContext(MarkdownImageLightboxContext);
}

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

function collectImages(container: HTMLElement): MarkdownLightboxImage[] {
  const nodes = container.querySelectorAll("img[data-md-lightbox]");
  return Array.from(nodes).map((node) => {
    const img = node as HTMLImageElement;
    return {
      src: img.currentSrc || img.src,
      alt: img.alt ?? "",
    };
  });
}

function findImageIndex(images: MarkdownLightboxImage[], src: string): number {
  const index = images.findIndex((item) => item.src === src);
  if (index >= 0) return index;
  try {
    const target = new URL(src, window.location.href).href;
    return images.findIndex((item) => {
      try {
        return new URL(item.src, window.location.href).href === target;
      } catch {
        return item.src === src;
      }
    });
  } catch {
    return -1;
  }
}

export function MarkdownImageLightboxProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const modalState = useOverlayState();
  const [images, setImages] = useState<MarkdownLightboxImage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;
  const canPan = scale > 1;

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    dragStateRef.current = null;
    setIsDragging(false);
  }, []);

  const resetForNewImage = useCallback(() => {
    resetZoom();
    setBaseSize(null);
  }, [resetZoom]);

  const captureBaseSize = useCallback(() => {
    const img = imgRef.current;
    if (!img || img.clientWidth === 0 || img.clientHeight === 0) return;
    setBaseSize({ width: img.clientWidth, height: img.clientHeight });
  }, []);

  const zoomIn = useCallback(() => {
    setScale((current) => clampZoom(current + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((current) => {
      const next = clampZoom(current - ZOOM_STEP);
      if (next <= 1) {
        setTranslate({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      resetForNewImage();
      setActiveIndex((index + images.length) % images.length);
    },
    [images.length, resetForNewImage],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  const openImage = useCallback(
    (src: string) => {
      const container = containerRef.current;
      if (!container) return;

      const collected = collectImages(container);
      if (collected.length === 0) return;

      const index = findImageIndex(collected, src);
      resetForNewImage();
      setImages(collected);
      setActiveIndex(index >= 0 ? index : 0);
      modalState.open();
    },
    [modalState, resetForNewImage],
  );

  useEffect(() => {
    if (!modalState.isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      }
      if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      }
      if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalState.isOpen, goNext, goPrev, resetZoom, zoomIn, zoomOut]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !modalState.isOpen) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setScale((current) => {
        const next = clampZoom(current + delta);
        if (next <= 1) {
          setTranslate({ x: 0, y: 0 });
        }
        return next;
      });
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [modalState.isOpen, activeImage?.src]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canPan || event.button !== 0) return;
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: translate.x,
        originY: translate.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    },
    [canPan, translate.x, translate.y],
  );

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setTranslate({
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    });
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const displayWidth = baseSize ? baseSize.width * scale : undefined;
  const displayHeight = baseSize ? baseSize.height * scale : undefined;

  const toolbarButtonClass =
    "rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-40";

  return (
    <MarkdownImageLightboxContext.Provider value={{ openImage }}>
      <div ref={containerRef} className="contents">
        {children}
      </div>

      <Modal state={modalState}>
        <Modal.Backdrop className="bg-black/85">
          <Modal.Container size="full" className="items-stretch justify-stretch p-0">
            <Modal.Dialog className="relative flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-hidden border-0 bg-transparent p-0 shadow-none">
              <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-3 py-3 sm:px-4">
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    aria-label="缩小"
                    variant="ghost"
                    className={toolbarButtonClass}
                    isDisabled={scale <= ZOOM_MIN}
                    onPress={zoomOut}
                  >
                    <ZoomOutIcon className="size-5" />
                  </Button>
                  <Button
                    aria-label="重置缩放"
                    variant="ghost"
                    className={clsx(toolbarButtonClass, "min-w-14 px-3 text-xs tabular-nums")}
                    onPress={resetZoom}
                  >
                    {Math.round(scale * 100)}%
                  </Button>
                  <Button
                    isIconOnly
                    aria-label="放大"
                    variant="ghost"
                    className={toolbarButtonClass}
                    isDisabled={scale >= ZOOM_MAX}
                    onPress={zoomIn}
                  >
                    <ZoomInIcon className="size-5" />
                  </Button>
                </div>
                <Modal.CloseTrigger className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70" />
              </div>

              {activeImage ? (
                <div
                  ref={viewportRef}
                  className={clsx(
                    "relative min-h-0 flex-1",
                    scale > 1 ? "overflow-auto" : "overflow-hidden",
                    canPan && (isDragging ? "cursor-grabbing" : "cursor-grab"),
                  )}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <div className="flex min-h-full min-w-full items-center justify-center touch-none p-4 sm:p-6">
                    <div
                      className={clsx(
                        "inline-flex items-center justify-center",
                        !isDragging && "transition-transform duration-150 ease-out",
                      )}
                      style={{
                        transform: `translate(${translate.x}px, ${translate.y}px)`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imgRef}
                        key={activeImage.src}
                        src={activeImage.src}
                        alt={activeImage.alt}
                        draggable={false}
                        onLoad={captureBaseSize}
                        className={clsx(
                          "object-contain select-none",
                          baseSize ? "max-h-none max-w-none" : "max-h-[calc(100dvh-8rem)] max-w-[min(92vw,100%)]",
                        )}
                        style={
                          baseSize
                            ? {
                                width: displayWidth,
                                height: displayHeight,
                              }
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  {hasMultiple ? (
                    <>
                      <Button
                        isIconOnly
                        aria-label="上一张"
                        variant="ghost"
                        className="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 sm:left-4"
                        onPress={goPrev}
                      >
                        <ChevronLeftIcon className="size-5" />
                      </Button>
                      <Button
                        isIconOnly
                        aria-label="下一张"
                        variant="ghost"
                        className="absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 sm:right-4"
                        onPress={goNext}
                      >
                        <ChevronRightIcon className="size-5" />
                      </Button>
                    </>
                  ) : null}

                  {activeImage.alt || hasMultiple ? (
                    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex max-w-[min(92vw,36rem)] -translate-x-1/2 flex-col items-center gap-2 sm:bottom-4">
                      {activeImage.alt ? (
                        <p className="rounded-full bg-black/50 px-4 py-2 text-center text-xs leading-relaxed text-white/90 backdrop-blur-sm sm:text-sm">
                          {activeImage.alt}
                        </p>
                      ) : null}
                      {hasMultiple ? (
                        <p className="rounded-full bg-black/50 px-3 py-1 text-xs tabular-nums text-white/80 backdrop-blur-sm">
                          {activeIndex + 1} / {images.length}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </MarkdownImageLightboxContext.Provider>
  );
}

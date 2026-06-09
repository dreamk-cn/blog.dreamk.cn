"use client";

import { useEffect, useState } from "react";
import type { MarkdownTocItem } from "@/lib/markdown-toc";
import { PostTableOfContents } from "@/components/post/post-table-of-contents";

export function PostViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const key = `post-view-tracked:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/post/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // View tracking failure should not affect page rendering.
    });
  }, [slug]);

  return null;
}

export function MobilePostToc({ items }: { items: MarkdownTocItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 rounded-full border border-default-200/80 bg-background px-4 py-2 text-sm font-medium shadow-md backdrop-blur-md xl:hidden"
      >
        目录
      </button>

      <div
        className={`fixed inset-0 z-50 xl:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/45 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="关闭目录"
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[78vw] max-w-[320px] transform border-l border-default-200/70 bg-background/95 p-4 shadow-xl backdrop-blur-md transition-transform duration-300 ease-out dark:border-default-100/20 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-text-base">目录</h2>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-text-muted">
              关闭
            </button>
          </div>
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto pr-1 [scrollbar-width:thin]">
            <PostTableOfContents items={items} />
          </div>
        </aside>
      </div>
    </>
  );
}

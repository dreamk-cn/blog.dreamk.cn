"use client";

import { useMemo } from "react";
import type { MarkdownTocItem } from "@/lib/markdown-toc";
import { usePostTocActive } from "@/components/post/post-toc-active-context";

export function PostTableOfContents({ items, className = "" }: { items: MarkdownTocItem[]; className?: string }) {
  const tocCtx = usePostTocActive();
  const activeId = tocCtx?.activeId ?? null;
  const setActiveId = tocCtx?.setActiveId;

  const itemSet = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  if (items.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm leading-6 text-text-muted">本文暂无二级以上标题，目录将在你使用 ##、### 等标题后出现。</p>
      </div>
    );
  }

  return (
    <nav aria-label="文章目录" className={className}>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, index) => {
          const isActive = activeId !== null && item.id === activeId;
          return (
            <li key={`${item.id}-${index}`} style={{ paddingLeft: `${Math.max(0, item.level - 2) * 12}px` }}>
              <a
                href={`#${item.id}`}
                className={`line-clamp-2 block rounded-md py-1.5 pl-2 pr-1 transition-colors ${
                  isActive
                    ? "bg-primary/12 font-medium text-primary dark:bg-primary/20"
                    : "text-text-base hover:bg-default-100 hover:text-primary dark:hover:bg-default-100/10"
                }`}
                onClick={(e) => {
                  if (!itemSet.has(item.id)) return;
                  e.preventDefault();
                  const el = document.getElementById(item.id);
                  if (!el) return;

                  const offset = 112;
                  const top = window.scrollY + el.getBoundingClientRect().top - offset;
                  window.scrollTo({
                    top: Math.max(0, top),
                    behavior: "smooth",
                  });
                  window.history.replaceState(null, "", `#${item.id}`);

                  if (setActiveId) {
                    setActiveId(item.id);
                  }
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

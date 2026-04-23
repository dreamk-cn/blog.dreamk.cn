"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MarkdownTocItem } from "@/lib/markdown-toc";

/** 与正文标题 `scroll-mt-28`、顶部导航大致对齐 */
const ACTIVE_HEADING_OFFSET_PX = 112;

type TocActiveContextValue = {
  activeId: string | null;
  setActiveId: (id: string) => void;
};

const TocActiveContext = createContext<TocActiveContextValue | null>(null);

export function PostTocActiveProvider({ items, children }: { items: MarkdownTocItem[]; children: ReactNode }) {
  const [activeId, setActiveIdState] = useState<string | null>(() => items[0]?.id ?? null);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
  }, []);

  const computeActive = useCallback(() => {
    if (items.length === 0) return;
    let current = items[0].id;
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET_PX) {
        current = item.id;
      }
    }
    setActiveIdState(current);
  }, [items]);

  useEffect(() => {
    if (items.length === 0 || typeof window === "undefined") return;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const id = visible[0].target.id;
          setActiveIdState(id);
          return;
        }

        // fallback: no heading intersecting, use top offset rule
        computeActive();
      },
      {
        root: null,
        rootMargin: `-${ACTIVE_HEADING_OFFSET_PX}px 0px -65% 0px`,
        threshold: [0, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, computeActive]);

  const resolvedActiveId = useMemo(() => {
    if (items.length === 0) return null;
    if (activeId && items.some((item) => item.id === activeId)) return activeId;
    return items[0].id;
  }, [activeId, items]);

  const value = useMemo(() => ({ activeId: resolvedActiveId, setActiveId }), [resolvedActiveId, setActiveId]);

  return <TocActiveContext.Provider value={value}>{children}</TocActiveContext.Provider>;
}

export function usePostTocActive() {
  return useContext(TocActiveContext);
}

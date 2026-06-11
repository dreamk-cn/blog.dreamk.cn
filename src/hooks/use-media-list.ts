"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  MediaCategoryFilter,
  MediaSortBy,
  MediaSortOrder,
  MediaSourceFilter,
} from "@/components/admin/media/media-toolbar";
import type { MediaListItem, MediaListResponse } from "@/components/admin/media/types";
import { useDebounce } from "@/hooks/useDebounce";
import { request } from "@/lib/request";

export type UseMediaListParams = {
  pageNo: number;
  pageSize: number;
  keyword?: string;
  category: MediaCategoryFilter;
  source: MediaSourceFilter;
  sortBy: MediaSortBy;
  sortOrder: MediaSortOrder;
  enabled?: boolean;
};

export function useMediaList({
  pageNo,
  pageSize,
  keyword = "",
  category,
  source,
  sortBy,
  sortOrder,
  enabled = true,
}: UseMediaListParams) {
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keywordDebounced = useDebounce(keyword, 300);

  const fetchMedia = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    try {
      const res = await request.get<MediaListResponse>("/admin/media", {
        pageNo,
        pageSize,
        keyword: keywordDebounced || undefined,
        category,
        source,
        sortBy,
        sortOrder,
      });
      if (res.code === 200) {
        setItems(res.data?.list ?? []);
        setTotal(res.data?.total ?? 0);
      } else {
        setError(res.message || "获取文件列表失败");
      }
    } catch (err) {
      console.error(err);
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }, [enabled, pageNo, pageSize, keywordDebounced, category, source, sortBy, sortOrder]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchMedia();
    });
  }, [fetchMedia]);

  return { items, total, loading, error, refetch: fetchMedia, keywordDebounced };
}

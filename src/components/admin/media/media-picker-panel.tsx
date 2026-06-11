"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Input, Label, Pagination, TextField, useOverlayState } from "@heroui/react";
import { StringSelect } from "@/components/admin/string-select";
import { MediaPickerGrid } from "@/components/admin/media/media-picker-grid";
import { MediaPreviewModal } from "@/components/admin/media/media-preview-modal";
import type {
  MediaCategoryFilter,
  MediaSortBy,
  MediaSortOrder,
  MediaSourceFilter,
} from "@/components/admin/media/media-toolbar";
import type { MediaListItem } from "@/components/admin/media/types";
import { useMediaList } from "@/hooks/use-media-list";

type MediaPickerPanelProps = {
  initialCategoryFilter?: MediaCategoryFilter;
  enabled?: boolean;
  onSelect: (item: MediaListItem) => void;
  onGoUpload?: () => void;
};

export function MediaPickerPanel({
  initialCategoryFilter = "ALL",
  enabled = true,
  onSelect,
  onGoUpload,
}: MediaPickerPanelProps) {
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(12);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<MediaCategoryFilter>(initialCategoryFilter);
  const [source, setSource] = useState<MediaSourceFilter>("ALL");
  const [sortBy, setSortBy] = useState<MediaSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<MediaSortOrder>("desc");

  const [previewItem, setPreviewItem] = useState<MediaListItem | null>(null);
  const previewModal = useOverlayState();

  const { items, total, loading, error } = useMediaList({
    pageNo,
    pageSize,
    keyword,
    category,
    source,
    sortBy,
    sortOrder,
    enabled,
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  function handleReset() {
    setKeyword("");
    setCategory(initialCategoryFilter);
    setSource("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPageNo(1);
  }

  function openPreview(item: MediaListItem) {
    setPreviewItem(item);
    previewModal.open();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <TextField className="min-w-[140px] flex-1">
          <Label className="text-text-muted">关键词</Label>
          <Input
            className="text-text-base"
            placeholder="按文件名或 URL 搜索"
            value={keyword}
            onChange={(event) => {
              setPageNo(1);
              setKeyword(event.target.value);
            }}
          />
        </TextField>

        <StringSelect
          className="w-28 text-text-muted"
          label="分类"
          selectedId={category}
          onSelectionChange={(id) => {
            setPageNo(1);
            setCategory(id as MediaCategoryFilter);
          }}
          options={[
            { id: "ALL", label: "全部分类" },
            { id: "ASSET", label: "通用" },
            { id: "COVER", label: "封面" },
            { id: "CONTENT", label: "正文" },
          ]}
        />

        <StringSelect
          className="w-28 text-text-muted"
          label="来源"
          selectedId={source}
          onSelectionChange={(id) => {
            setPageNo(1);
            setSource(id as MediaSourceFilter);
          }}
          options={[
            { id: "ALL", label: "全部来源" },
            { id: "UPLOAD", label: "本地上传" },
            { id: "EXTERNAL", label: "外链" },
          ]}
        />

        <StringSelect
          className="w-28 text-text-muted"
          label="排序"
          selectedId={sortBy}
          onSelectionChange={(id) => {
            setPageNo(1);
            setSortBy(id as MediaSortBy);
          }}
          options={[
            { id: "createdAt", label: "上传时间" },
            { id: "size", label: "文件大小" },
          ]}
        />

        <StringSelect
          className="w-24 text-text-muted"
          label="方向"
          selectedId={sortOrder}
          onSelectionChange={(id) => {
            setPageNo(1);
            setSortOrder(id as MediaSortOrder);
          }}
          options={[
            { id: "desc", label: "倒序" },
            { id: "asc", label: "正序" },
          ]}
        />

        <Button size="sm" variant="secondary" onPress={handleReset}>
          重置
        </Button>
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Title>错误</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      ) : null}

      <div className="max-h-[min(50vh,420px)] overflow-y-auto">
        <MediaPickerGrid
          items={items}
          loading={loading}
          onSelect={onSelect}
          onPreview={openPreview}
        />
      </div>

      {!loading && items.length === 0 && onGoUpload ? (
        <div className="flex justify-center">
          <Button size="sm" variant="secondary" onPress={onGoUpload}>
            去上传
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <span className="shrink-0 text-xs text-text-muted">共 {total} 条</span>
        <Pagination>
          <Pagination.Content className="gap-1">
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={pageNo <= 1}
                onPress={() => setPageNo((page) => Math.max(1, page - 1))}
              >
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <span className="px-2 text-xs text-text-muted">
                {pageNo} / {totalPages}
              </span>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next
                isDisabled={pageNo >= totalPages}
                onPress={() => setPageNo((page) => Math.min(totalPages, page + 1))}
              >
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </div>

      <MediaPreviewModal state={previewModal} item={previewItem} />
    </div>
  );
}

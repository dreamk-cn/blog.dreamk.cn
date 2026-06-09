"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { StringSelect } from "@/components/admin/string-select";
import type { MediaViewMode } from "@/components/admin/media/types";

export type MediaCategoryFilter = "ALL" | "ASSET" | "COVER" | "CONTENT";
export type MediaSourceFilter = "ALL" | "UPLOAD" | "EXTERNAL";
export type MediaSortBy = "createdAt" | "size";
export type MediaSortOrder = "asc" | "desc";

type MediaToolbarProps = {
  keyword: string;
  category: MediaCategoryFilter;
  source: MediaSourceFilter;
  sortBy: MediaSortBy;
  sortOrder: MediaSortOrder;
  viewMode: MediaViewMode;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: MediaCategoryFilter) => void;
  onSourceChange: (value: MediaSourceFilter) => void;
  onSortByChange: (value: MediaSortBy) => void;
  onSortOrderChange: (value: MediaSortOrder) => void;
  onViewModeChange: (value: MediaViewMode) => void;
  onReset: () => void;
  onUpload: () => void;
};

export function MediaToolbar({
  keyword,
  category,
  source,
  sortBy,
  sortOrder,
  viewMode,
  onKeywordChange,
  onCategoryChange,
  onSourceChange,
  onSortByChange,
  onSortOrderChange,
  onViewModeChange,
  onReset,
  onUpload,
}: MediaToolbarProps) {
  return (
    <div className="flex flex-col gap-4 text-text-base">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">文件管理</h1>
        <Button variant="primary" onPress={onUpload}>
          上传文件
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <TextField className="w-full sm:max-w-[30%]">
          <Label className="text-text-muted">关键词</Label>
          <Input
            className="text-text-base"
            placeholder="按文件名或 URL 搜索"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </TextField>

        <StringSelect
          className="w-32 text-text-muted"
          label="分类"
          selectedId={category}
          onSelectionChange={(id) => onCategoryChange(id as MediaCategoryFilter)}
          options={[
            { id: "ALL", label: "全部分类" },
            { id: "ASSET", label: "通用" },
            { id: "COVER", label: "封面" },
            { id: "CONTENT", label: "正文" },
          ]}
        />

        <StringSelect
          className="w-32 text-text-muted"
          label="来源"
          selectedId={source}
          onSelectionChange={(id) => onSourceChange(id as MediaSourceFilter)}
          options={[
            { id: "ALL", label: "全部来源" },
            { id: "UPLOAD", label: "本地上传" },
            { id: "EXTERNAL", label: "外链" },
          ]}
        />

        <StringSelect
          className="w-32 text-text-muted"
          label="排序字段"
          selectedId={sortBy}
          onSelectionChange={(id) => onSortByChange(id as MediaSortBy)}
          options={[
            { id: "createdAt", label: "上传时间" },
            { id: "size", label: "文件大小" },
          ]}
        />

        <StringSelect
          className="w-28 text-text-muted"
          label="方向"
          selectedId={sortOrder}
          onSelectionChange={(id) => onSortOrderChange(id as MediaSortOrder)}
          options={[
            { id: "desc", label: "倒序" },
            { id: "asc", label: "正序" },
          ]}
        />

        <div className="flex items-end gap-1">
          <Button
            size="sm"
            variant={viewMode === "table" ? "primary" : "secondary"}
            onPress={() => onViewModeChange("table")}
          >
            表格
          </Button>
          <Button
            size="sm"
            variant={viewMode === "grid" ? "primary" : "secondary"}
            onPress={() => onViewModeChange("grid")}
          >
            网格
          </Button>
        </div>

        <Button size="sm" variant="secondary" className="text-text-muted" onPress={onReset}>
          清空
        </Button>
      </div>
    </div>
  );
}

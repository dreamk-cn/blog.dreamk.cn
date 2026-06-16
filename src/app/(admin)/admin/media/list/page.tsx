"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOverlayState } from "@heroui/react";
import { PaginatedFooter } from "@/components/admin/paginated-footer";
import {
  AdminListLayout,
  AdminListBody,
  AdminListFooter,
  AdminListHeader,
  AdminListOverlays,
} from "@/components/admin/admin-list-layout";
import { MediaDeleteModal } from "@/components/admin/media/media-delete-modal";
import { MediaGridView } from "@/components/admin/media/media-grid-view";
import { MediaPreviewModal } from "@/components/admin/media/media-preview-modal";
import { MediaTableView } from "@/components/admin/media/media-table-view";
import {
  MediaToolbar,
  type MediaCategoryFilter,
  type MediaSortBy,
  type MediaSortOrder,
  type MediaSourceFilter,
} from "@/components/admin/media/media-toolbar";
import { MediaUploadModal } from "@/components/admin/media/media-upload-modal";
import type {
  MediaListItem,
  MediaViewMode,
} from "@/components/admin/media/types";
import { useMediaList } from "@/hooks/use-media-list";
import { request, type HttpError } from "@/lib/request";

const VIEW_MODE_STORAGE_KEY = "admin-media-view-mode";

function readStoredViewMode(): MediaViewMode {
  if (typeof window === "undefined") return "table";
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === "grid" ? "grid" : "table";
}

export default function AdminMediaListPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<MediaCategoryFilter>("ALL");
  const [source, setSource] = useState<MediaSourceFilter>("ALL");
  const [sortBy, setSortBy] = useState<MediaSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<MediaSortOrder>("desc");
  const [viewMode, setViewMode] = useState<MediaViewMode>(() =>
    readStoredViewMode(),
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [previewItem, setPreviewItem] = useState<MediaListItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MediaListItem | null>(null);

  const uploadModal = useOverlayState();
  const previewModal = useOverlayState();
  const deleteModal = useOverlayState();

  const { items, total, loading, error, refetch } = useMediaList({
    pageNo,
    pageSize,
    keyword,
    category,
    source,
    sortBy,
    sortOrder,
  });

  const errorMessage = listError ?? error;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  const handleViewModeChange = (mode: MediaViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const handleReset = () => {
    setKeyword("");
    setCategory("ALL");
    setSource("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPageNo(1);
    setPageSize(20);
    router.replace(pathname, { scroll: false });
  };

  const openPreview = (item: MediaListItem) => {
    setPreviewItem(item);
    previewModal.open();
  };

  const openDelete = (item: MediaListItem) => {
    setDeleteItem(item);
    deleteModal.open();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeletingId(deleteItem.id);
    setListError(null);
    try {
      const res = await request.delete<{ success: boolean }>(
        "/admin/media",
        { id: deleteItem.id },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        deleteModal.close();
        setDeleteItem(null);
        const isLastItemOnPage = items.length === 1 && pageNo > 1;
        if (isLastItemOnPage) {
          setPageNo(pageNo - 1);
        } else {
          void refetch();
        }
      }
    } catch (err) {
      const message = (err as HttpError).message;
      if (message) {
        setListError(message);
      }
      console.error("删除文件失败:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminListLayout error={errorMessage}>
        <AdminListHeader>
          <MediaToolbar
            keyword={keyword}
            category={category}
            source={source}
            sortBy={sortBy}
            sortOrder={sortOrder}
            viewMode={viewMode}
            onKeywordChange={(value) => {
              setPageNo(1);
              setKeyword(value);
            }}
            onCategoryChange={(value) => {
              setPageNo(1);
              setCategory(value);
            }}
            onSourceChange={(value) => {
              setPageNo(1);
              setSource(value);
            }}
            onSortByChange={(value) => {
              setPageNo(1);
              setSortBy(value);
            }}
            onSortOrderChange={(value) => {
              setPageNo(1);
              setSortOrder(value);
            }}
            onViewModeChange={handleViewModeChange}
            onReset={handleReset}
            onUpload={() => uploadModal.open()}
          />
        </AdminListHeader>

        <AdminListBody
          className={viewMode === "grid" ? "overflow-y-auto" : undefined}
        >
          {viewMode === "table" ? (
            <MediaTableView
              items={items}
              loading={loading}
              deletingId={deletingId}
              onPreview={openPreview}
              onDelete={openDelete}
            />
          ) : (
            <MediaGridView
              items={items}
              loading={loading}
              deletingId={deletingId}
              onPreview={openPreview}
              onDelete={openDelete}
            />
          )}
        </AdminListBody>

        <AdminListFooter>
          <PaginatedFooter
            total={total}
            pageNo={pageNo}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={setPageNo}
            onPageSizeChange={(size) => {
              setPageNo(1);
              setPageSize(size);
            }}
          />
        </AdminListFooter>
      </AdminListLayout>

      <AdminListOverlays>
        <MediaUploadModal
          state={uploadModal}
          onUploaded={() => {
            setPageNo(1);
            void refetch();
          }}
        />

        <MediaPreviewModal state={previewModal} item={previewItem} />

        <MediaDeleteModal
          state={deleteModal}
          item={deleteItem}
          deleting={deletingId === deleteItem?.id}
          onConfirm={() => void handleDelete()}
        />
      </AdminListOverlays>
    </>
  );
}

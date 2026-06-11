'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Alert,
  Pagination,
  useOverlayState,
} from '@heroui/react';
import { StringSelect } from '@/components/admin/string-select';
import { MediaDeleteModal } from '@/components/admin/media/media-delete-modal';
import { MediaGridView } from '@/components/admin/media/media-grid-view';
import { MediaPreviewModal } from '@/components/admin/media/media-preview-modal';
import { MediaTableView } from '@/components/admin/media/media-table-view';
import {
  MediaToolbar,
  type MediaCategoryFilter,
  type MediaSortBy,
  type MediaSortOrder,
  type MediaSourceFilter,
} from '@/components/admin/media/media-toolbar';
import { MediaUploadModal } from '@/components/admin/media/media-upload-modal';
import type { MediaListItem, MediaViewMode } from '@/components/admin/media/types';
import { useMediaList } from '@/hooks/use-media-list';
import { request, type HttpError } from '@/lib/request';

const VIEW_MODE_STORAGE_KEY = 'admin-media-view-mode';

function readStoredViewMode(): MediaViewMode {
  if (typeof window === 'undefined') return 'table';
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === 'grid' ? 'grid' : 'table';
}

export default function AdminMediaListPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<MediaCategoryFilter>('ALL');
  const [source, setSource] = useState<MediaSourceFilter>('ALL');
  const [sortBy, setSortBy] = useState<MediaSortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<MediaSortOrder>('desc');
  const [viewMode, setViewMode] = useState<MediaViewMode>(() => readStoredViewMode());

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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const handleViewModeChange = (mode: MediaViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const handleReset = () => {
    setKeyword('');
    setCategory('ALL');
    setSource('ALL');
    setSortBy('createdAt');
    setSortOrder('desc');
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
        '/admin/media',
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
      console.error('删除文件失败:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const bottomContent = (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-sm text-text-muted">共 {total} 条数据</span>
        <StringSelect
          aria-label="每页条数"
          className="w-32"
          selectedId={String(pageSize)}
          onSelectionChange={(id) => {
            setPageNo(1);
            setPageSize(Number(id));
          }}
          options={[
            { id: '10', label: '10条/页' },
            { id: '20', label: '20条/页' },
            { id: '50', label: '50条/页' },
          ]}
        />
      </div>
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
            <span className="px-2 text-small text-default-600">
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
  );

  return (
    <div className="space-y-4 bg-canvas p-4 h-full">
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

      {viewMode === 'table' ? (
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

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Title>错误</Alert.Title>
          <Alert.Description>{errorMessage}</Alert.Description>
        </Alert>
      ) : null}

      {bottomContent}

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
    </div>
  );
}

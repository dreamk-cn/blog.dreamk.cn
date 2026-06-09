"use client";

import { Chip, Spinner, Table } from "@heroui/react";
import { MediaActions } from "@/components/admin/media/media-actions";
import { MediaThumbnail } from "@/components/admin/media/media-thumbnail";
import {
  formatFileSize,
  formatMediaDate,
  getMediaDisplayName,
  MEDIA_CATEGORY_LABELS,
  MEDIA_SOURCE_LABELS,
  type MediaListItem,
} from "@/components/admin/media/types";

type MediaTableViewProps = {
  items: MediaListItem[];
  loading: boolean;
  error: string | null;
  deletingId: string | null;
  onPreview: (item: MediaListItem) => void;
  onDelete: (item: MediaListItem) => void;
};

export function MediaTableView({
  items,
  loading,
  error,
  deletingId,
  onPreview,
  onDelete,
}: MediaTableViewProps) {
  return (
    <div className="rounded-lg bg-content1">
      <Table>
        <Table.ScrollContainer className="max-h-[calc(100vh-280px)]">
          <Table.Content aria-label="文件列表">
            <Table.Header>
              <Table.Column isRowHeader>预览</Table.Column>
              <Table.Column>文件名 / URL</Table.Column>
              <Table.Column>分类</Table.Column>
              <Table.Column>来源</Table.Column>
              <Table.Column>大小</Table.Column>
              <Table.Column>上传时间</Table.Column>
              <Table.Column>引用</Table.Column>
              <Table.Column className="text-center">操作</Table.Column>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <div className="flex justify-center py-3">
                      <Spinner color="accent" aria-label="加载中" />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : error ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <span className="text-red-500">{error}</span>
                  </Table.Cell>
                </Table.Row>
              ) : items.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <span className="text-text-muted">暂无数据</span>
                  </Table.Cell>
                </Table.Row>
              ) : (
                items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>
                      <div className="relative h-10 w-10 overflow-hidden rounded-md bg-canvas">
                        <MediaThumbnail url={item.url} alt={getMediaDisplayName(item)} sizes="40px" />
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="max-w-xs">
                        <p className="truncate text-sm text-text-base">{getMediaDisplayName(item)}</p>
                        <p className="truncate text-xs text-text-muted">{item.url}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" variant="soft" color="accent">
                        <Chip.Label>{MEDIA_CATEGORY_LABELS[item.category]}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-text-muted">{MEDIA_SOURCE_LABELS[item.source]}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-text-muted">{formatFileSize(item.size)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-xs text-text-muted">{formatMediaDate(item.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-text-muted">{item.usageCount}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <MediaActions
                        item={item}
                        deleting={deletingId === item.id}
                        onPreview={onPreview}
                        onDelete={onDelete}
                      />
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}

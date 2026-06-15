'use client';

import { Pagination } from '@heroui/react';
import { StringSelect } from '@/components/admin/string-select';

export type PageSizeOption = { value: number; label: string };

const DEFAULT_PAGE_SIZE_OPTIONS: PageSizeOption[] = [
  { value: 10, label: '10条/页' },
  { value: 20, label: '20条/页' },
  { value: 50, label: '50条/页' },
];

export interface PaginatedFooterProps {
  total: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: PageSizeOption[];
  /** 左侧自定义内容，如果不传则显示 "共 N 条数据" */
  summary?: React.ReactNode;
}

export function PaginatedFooter({
  total,
  pageNo,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  summary,
}: PaginatedFooterProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-4">
        {summary ?? (
          <span className="shrink-0 text-sm text-text-muted">共 {total} 条数据</span>
        )}
        <StringSelect
          aria-label="每页条数"
          className="w-32"
          selectedId={String(pageSize)}
          onSelectionChange={(id) => onPageSizeChange(Number(id))}
          options={pageSizeOptions.map((o) => ({ id: String(o.value), label: o.label }))}
        />
      </div>
      <Pagination>
        <Pagination.Content className="gap-1">
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={pageNo <= 1}
              onPress={() => onPageChange(Math.max(1, pageNo - 1))}
            >
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item>
            <span className="px-2 text-small text-text-muted">
              {pageNo} / {totalPages}
            </span>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next
              isDisabled={pageNo >= totalPages}
              onPress={() => onPageChange(Math.min(totalPages, pageNo + 1))}
            >
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}

'use client';

import { Alert, Table } from '@heroui/react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface AdminListLayoutProps {
  children: ReactNode;
  error?: string | null;
  errorTitle?: string;
}

/** 后台列表页外壳：占满 main 高度，页面本身不滚动。 */
export function AdminListLayout({
  children,
  error,
  errorTitle = '错误',
}: AdminListLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-canvas p-4 text-text-base">
      {children}
      {error ? (
        <Alert status="danger" className="shrink-0">
          <Alert.Title>{errorTitle}</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      ) : null}
    </div>
  );
}

export function AdminListHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx('shrink-0', className)}>{children}</div>;
}

/**
 * 表格主体占位：用 absolute 撑满剩余高度，供 Table.ScrollContainer 获得确定高度。
 * 网格视图可传 `className="overflow-y-auto"`。
 */
export function AdminListBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-0 flex-1">
      <div className={clsx('absolute inset-0 overflow-hidden', className)}>
        {children}
      </div>
    </div>
  );
}

export function AdminListFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx('shrink-0', className)}>{children}</div>;
}

/** Modal 等浮层，放在 AdminListLayout 外，避免参与 flex 高度计算。 */
export function AdminListOverlays({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const adminTableRootClassName = 'h-full min-h-0 grid-rows-[minmax(0,1fr)]';
export const adminTableScrollClassName = 'h-full min-h-0 overflow-y-auto';
export const adminTableHeaderClassName = 'sticky top-0 z-10';

export interface AdminListTableProps {
  'aria-label': string;
  children: ReactNode;
  className?: string;
}

/** 固定表头 + 表体在 ScrollContainer 内滚动的表格壳。 */
export function AdminListTable({
  'aria-label': ariaLabel,
  children,
  className,
}: AdminListTableProps) {
  return (
    <div className={clsx('h-full min-h-0', className)}>
      <Table className={adminTableRootClassName}>
        <Table.ScrollContainer className={adminTableScrollClassName}>
          <Table.Content aria-label={ariaLabel}>{children}</Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}

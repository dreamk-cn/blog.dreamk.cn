'use client';

import { Alert } from '@heroui/react';
import type { ReactNode } from 'react';

export interface AdminListLayoutProps {
  children: ReactNode;
  error?: string | null;
  errorTitle?: string;
}

export function AdminListLayout({
  children,
  error,
  errorTitle = '错误',
}: AdminListLayoutProps) {
  return (
    <div className="space-y-4 p-4 text-text-base bg-canvas h-full">
      {children}
      {error ? (
        <Alert status="danger">
          <Alert.Title>{errorTitle}</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      ) : null}
    </div>
  );
}

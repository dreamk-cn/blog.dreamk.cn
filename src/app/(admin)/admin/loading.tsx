"use client";

import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <Spinner color="accent" aria-label="正在加载" size="lg" />
        <p className="text-sm text-default-500">正在加载...</p>
      </div>
    </div>
  );
}

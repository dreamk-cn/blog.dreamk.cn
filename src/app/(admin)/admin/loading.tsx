'use client'

import { Spinner } from '@heroui/react'

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner color="accent" aria-label="正在加载" />
        <p className="text-sm text-default-500">正在加载…</p>
        <p className="text-default-500 text-sm">页面切换中，请稍候</p>
      </div>
    </div>
  )
}
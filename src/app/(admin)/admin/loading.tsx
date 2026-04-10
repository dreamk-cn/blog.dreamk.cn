'use client'

import { Spinner } from '@heroui/react'

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner label="正在加载..." color="primary" />
        <p className="text-default-500 text-sm">页面切换中，请稍候</p>
      </div>
    </div>
  )
}
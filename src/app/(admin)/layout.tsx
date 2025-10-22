'use client'

import { Layout } from "@/components/layouts/admin/layout";

export default function AdminLayout({ children }: { children: React.ReactNode}) {
  return (
    <Layout>{ children }</Layout>
  )
}
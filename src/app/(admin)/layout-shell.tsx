"use client";

import { Layout } from "@/components/layouts/admin/layout";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

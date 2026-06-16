import type { Metadata } from "next";
import { buildCanonical, buildNoIndexRobots } from "@/lib/seo";
import { AdminLayoutShell } from "./layout-shell";

export const metadata: Metadata = {
  title: "后台管理",
  description: "Dreamk 博客后台管理页面。",
  alternates: buildCanonical("/admin"),
  robots: buildNoIndexRobots(),
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

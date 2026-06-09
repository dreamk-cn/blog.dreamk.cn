'use client'

import { siteConfig } from "@/config/site";
import { Link } from "@heroui/react";


export default function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center border-t border-border bg-background/95 p-1 backdrop-blur-sm">
      <Link href="https://beian.miit.gov.cn" className="text-primary">{ siteConfig.ICP }</Link>
    </footer>
  )
}
'use client'

import { siteConfig } from "@/config/site";
import { Link } from "@heroui/react";


export default function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center border-t border-gray-200 bg-background/95 p-1 backdrop-blur-sm dark:border-gray-700">
      <Link href="https://beian.miit.gov.cn" className="text-primary">{ siteConfig.ICP }</Link>
    </footer>
  )
}
'use client'

import { siteConfig } from "@/config/site";
import { Link } from "@heroui/react";


export default function Footer() {
  return (
    <footer className="flex items-center justify-center p-1 border-t-1 border-gray-200 dark:border-gray-700">
      <Link href="https://beian.miit.gov.cn">{ siteConfig.ICP }</Link>
    </footer>
  )
}
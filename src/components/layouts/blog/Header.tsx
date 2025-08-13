'use client'

import LoginButton from "@/components/buttons/LoginButton";
import LogoutButton from "@/components/buttons/LogoutButton";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function BlogHeader({ links }: { links: { href: string, label: string }[] }) {
  const session = useSession()
  return (
    <div className="h-15 backdrop-blur bg-background sticky top-0 shadow dark:shadow-gray-700 shrink-0 flex items-center justify-between px-24 max-lg:px-2">
      <div className="text-xl">
        Dreamk Blog
      </div>
      <nav className="flex text-base gap-2 items-center">
        {
          links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="px-2 py-1 rounded duration-250"
            >{link.label}</Link>
          ))
        }
        { session.status === 'authenticated' ? <LogoutButton /> : <LoginButton auth={session.data} /> }
        <ThemeSwitcher />
      </nav>
    </div>
  )
}
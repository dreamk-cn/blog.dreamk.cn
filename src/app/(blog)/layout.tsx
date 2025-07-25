import Link from "next/link";
import { ThemeSwitcher } from "../components/ThemeSwitcher";

export default function BlogLayout({ children }: { children: React.ReactNode }) {

  const links = [
    { href: '/', label: '首页' },
    { href: '/posts', label: '博客' },
    { href: '/categories', label: '分类'},
    { href: '/about', label: '关于我' },
  ]

  return (
    <div className="h-[100vh] flex flex-col relative">
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
          <ThemeSwitcher />
        </nav>
      </div>
      <div className="flex-1 flex flex-col overflow-auto">
        { children }
      </div>
      <footer className="flex items-center justify-center p-1 border-t-1 border-gray-200 dark:border-gray-700">
        Footer
      </footer>
    </div>
  )
}
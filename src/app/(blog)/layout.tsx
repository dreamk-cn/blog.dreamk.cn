import BlogHeader from "@/components/layouts/blog/Header"

export default function BlogLayout({ children }: { children: React.ReactNode }) {

  const links = [
    { href: '/', label: '首页' },
    { href: '/posts', label: '博客' },
    { href: '/categories', label: '分类'},
    { href: '/about', label: '关于我' },
  ]

  return (
    <div className="h-[100vh] flex flex-col relative">
      <BlogHeader links={links} />
      <div className="flex-1 flex flex-col overflow-auto">
        { children }
      </div>
      <footer className="flex items-center justify-center p-1 border-t-1 border-gray-200 dark:border-gray-700">
        Footer
      </footer>
    </div>
  )
}
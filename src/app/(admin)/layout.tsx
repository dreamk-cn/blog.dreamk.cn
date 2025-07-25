export default function AdminLayout({ children }: { children: React.ReactNode}) {
  return (
    <div className="bg-red h-100vh w-100vw">
      { children }
    </div>
  )
}
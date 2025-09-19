import Footer from "@/components/layouts/blog/footer"
import { Navbar } from "@/components/layouts/blog/navbar"

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100vh] flex flex-col relative">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-auto">
        { children }
      </div>
      <Footer />
    </div>
  )
}
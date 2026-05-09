import Footer from "@/components/layouts/blog/footer"
import { Navbar } from "@/components/layouts/blog/navbar"

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-foreground pb-10">
      <Navbar />
      { children }
      <Footer />
    </div>
  )
}
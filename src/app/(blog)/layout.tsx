import Footer from "@/components/layouts/blog/footer";
import { Navbar } from "@/components/layouts/blog/navbar";

/** build 时不连库预渲染；首次访问后再通过 unstable_cache 写入 Data Cache */
export const dynamic = "force-dynamic";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-canvas pb-10">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

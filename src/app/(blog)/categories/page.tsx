import NextLink from "next/link";
import { ClientCard, ClientCardBody } from "@/components/ui/heroui-client";
import { listPublicCategoriesWithPostCount } from "@/services/category-service";

export const revalidate = 300;

export default async function Categories() {
  const list = await listPublicCategoriesWithPostCount();

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-base">分类</h1>
        <p className="text-sm text-text-muted">按主题浏览文章，点击分类查看完整列表。</p>

        {list.length === 0 ? (
          <ClientCard className="shadow-sm">
            <ClientCardBody className="py-10 text-center text-text-muted">还没有可展示的分类</ClientCardBody>
          </ClientCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((category) => (
              <NextLink
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-xl border border-border bg-background p-5 shadow-sm transition-colors hover:border-primary"
              >
                <div className="space-y-2">
                  <h2 className="line-clamp-1 text-lg font-semibold text-text-base">{category.name}</h2>
                  <p className="text-sm text-text-muted">共 {category.postCount} 篇文章</p>
                </div>
              </NextLink>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
import NextLink from "next/link";
import { ClientCard, ClientCardBody } from "@/components/ui/heroui-client";
import { contentConfig } from "@/config/content";
import { prisma } from "@/libs/prisma";

type CategoryWithPostCount = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

export default async function Categories() {
  const [categories, groupedPostCounts] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.post.groupBy({
      by: ["categoryId"],
      where: {
        status: "PUBLISHED",
        slug: {
          notIn: [...contentConfig.excludedPostSlugsForPublicFeed],
        },
        categoryId: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const postCountMap = new Map(
    groupedPostCounts
      .filter((item) => item.categoryId)
      .map((item) => [item.categoryId as string, item._count._all]),
  );

  const list: CategoryWithPostCount[] = categories
    .map((category) => ({
      ...category,
      postCount: postCountMap.get(category.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.postCount !== a.postCount) return b.postCount - a.postCount;
      return a.name.localeCompare(b.name, "zh-CN");
    });

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
import { PostCard } from "@/components/post/post-card";
import { siteConfig } from "@/config/site";
import { prisma } from "@/libs/prisma";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const [posts, hotPosts, tagCloud] = await Promise.all([
    prisma.post.findMany({
      include: {
        tags: true
      },
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc',
      }
    }),
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
      },
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 8,
    }),
    prisma.tag.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      take: 16,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-3 py-4 lg:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-4">
        <aside className="space-y-4">
          <section className="rounded-md border border-default-200/70 bg-content1 p-6 text-center">
            <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border border-default-200">
              <Image src={siteConfig.avatar} width={80} height={80} alt={siteConfig.name} />
            </div>
            <h2 className="text-xl font-semibold">{siteConfig.name}</h2>
            <p className="text-sm text-default-500 mt-1">Web Developer & Designer</p>
            <div className="flex justify-center gap-3 text-sm mt-3">
                <Link href={siteConfig.links.github} target="_blank" className="hover:text-primary">
                  github
                </Link>
                <Link href="https://www.bilibili.com" target="_blank" className="hover:text-primary">
                  bilibili
                </Link>
            </div>
          </section>

          <section className="rounded-md border border-default-200/70 bg-content1">
            <div className="px-4 py-3 font-semibold border-b border-default-200/70">标签</div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {tagCloud.map((tag) => (
                  <span key={tag.id} className="text-xs px-2 py-1 rounded-full bg-default-100 text-default-600">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          {posts.map((post) => {
            return <PostCard post={post} key={post.id} />
          })}
          {posts.length === 0 && (
            <div className="rounded-md border border-default-200/70 bg-content1 py-10 text-center text-default-500">
                还没有发布文章
            </div>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-md border border-default-200/70 bg-content1">
            <div className="px-4 py-3 font-semibold border-b border-default-200/70">热门文章列表</div>
            <div className="p-4 flex flex-col gap-3">
              {hotPosts.map((post, index) => (
                <div key={post.id} className="flex items-start justify-between gap-3">
                  <Link href={`/posts/${post.slug}`} className="text-sm line-clamp-2 hover:text-primary">
                    {index + 1}. {post.title}
                  </Link>
                  <span className="text-xs text-default-500 whitespace-nowrap">{post.viewCount}</span>
                </div>
              ))}
              {hotPosts.length === 0 && (
                <p className="text-sm text-default-500">暂无热门文章</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

import { PostCard } from "@/components/post/post-card";
import { ProfileSidebar } from "@/components/layouts/blog/profile-sidebar";
import { HotPosts } from "@/components/post/hot-posts";
import { contentConfig } from "@/config/content";
import { prisma } from "@/libs/prisma";
import { ClientCard, ClientCardBody } from "@/components/ui/heroui-client";
import NextLink from "next/link";

const HOME_RECENT_POSTS_LIMIT = 6;

export default async function Home() {
  const [posts, hotPosts, categories, friendLinks] = await Promise.all([
    prisma.post.findMany({
      include: {
        tags: true
      },
      where: {
        status: 'PUBLISHED',
        slug: {
          notIn: [...contentConfig.excludedPostSlugsForPublicFeed],
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: HOME_RECENT_POSTS_LIMIT,
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
        slug: {
          notIn: [...contentConfig.excludedPostSlugsForPublicFeed],
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 8,
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 16,
    }),
    prisma.friendLink.findMany({
      where: {
        status: "APPROVED",
      },
      orderBy: [
        { sortOrder: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        url: true,
      },
    }),
  ]);

  const profileSidebarEl = <ProfileSidebar categories={categories} friendLinks={friendLinks} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_280px]">
        <aside className="hidden lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto lg:space-y-4">
          {profileSidebarEl}
        </aside>

        <main className="order-1 space-y-4 lg:order-none">
          {posts.map((post) => {
            return <PostCard post={post} key={post.id} />
          })}
          {posts.length === 0 && (
            <ClientCard className="shadow-sm">
              <ClientCardBody className="py-10 text-center text-text-muted">
                还没有发布文章
              </ClientCardBody>
            </ClientCard>
          )}
          {posts.length > 0 && (
            <div className="pt-1 text-center">
              <NextLink
                href="/posts"
                className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-text-base transition-colors hover:border-primary hover:text-primary"
              >
                查看全部文章
              </NextLink>
            </div>
          )}
        </main>

        <aside className="order-2 space-y-4 lg:order-none">
          <HotPosts posts={hotPosts} />
        </aside>
      </div>
    </div>
  );
}

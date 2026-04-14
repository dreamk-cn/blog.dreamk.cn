import { PostCard } from "@/components/post/post-card";
import { MobileSidebarDrawer } from "@/components/layouts/blog/mobile-sidebar-drawer";
import { ProfileSidebar } from "@/components/layouts/blog/profile-sidebar";
import { HotPosts } from "@/components/post/hot-posts";
import { prisma } from "@/libs/prisma";

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

  const profileSidebarEl = <ProfileSidebar tagCloud={tagCloud} />;

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 lg:py-8">
      <MobileSidebarDrawer>{profileSidebarEl}</MobileSidebarDrawer>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_260px]">
        <aside className="hidden lg:block lg:space-y-4">
          {profileSidebarEl}
        </aside>

        <main className="order-1 space-y-4 lg:order-none">
          {posts.map((post) => {
            return <PostCard post={post} key={post.id} />
          })}
          {posts.length === 0 && (
            <div className="text-center text-default-500">还没有发布文章</div>
          )}
        </main>

        <aside className="order-2 space-y-4 lg:order-none">
          <HotPosts posts={hotPosts} />
        </aside>
      </div>
    </div>
  );
}

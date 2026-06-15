import type { Metadata } from "next";
import { PostCard } from "@/components/post/post-card";
import { ProfileSidebar } from "@/components/layouts/blog/profile-sidebar";
import { HotPosts } from "@/components/post/hot-posts";
import { RecentComments } from "@/components/post/recent-comments";
import { ClientCard, ClientCardBody } from "@/components/ui/heroui-client";
import { AppLink } from "@/components/ui/app-link";
import { siteConfig } from "@/config/site";
import { buildCanonical } from "@/lib/seo";
import { listPublicCategories } from "@/services/category-service";
import { listApprovedFriendLinks } from "@/services/friend-link-service";
import { listRecentApprovedComments } from "@/services/comment-service";
import { listHotPublicPosts, listRecentPublicPosts } from "@/services/post-service";

const HOME_RECENT_POSTS_LIMIT = 6;
const HOME_RECENT_COMMENTS_LIMIT = 8;

export const metadata: Metadata = {
  description: siteConfig.description,
  alternates: buildCanonical("/"),
};

export default async function Home() {
  const [posts, hotPosts, recentComments, categories, friendLinks] = await Promise.all([
    listRecentPublicPosts(HOME_RECENT_POSTS_LIMIT),
    listHotPublicPosts(8),
    listRecentApprovedComments(HOME_RECENT_COMMENTS_LIMIT),
    listPublicCategories(16),
    listApprovedFriendLinks(),
  ]);

  const profileSidebarEl = <ProfileSidebar categories={categories} friendLinks={friendLinks} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_280px]">
        <aside className="hidden lg:block">
          <div className="fixed top-20 w-[280px] max-h-[calc(100vh-7rem)] overflow-auto">
            {profileSidebarEl}
          </div>
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
              <AppLink
                href="/posts"
                className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-text-base transition-colors hover:border-primary hover:text-primary"
              >
                查看全部文章
              </AppLink>
            </div>
          )}
        </main>

        <aside className="order-2 space-y-4 lg:order-none">
          <HotPosts posts={hotPosts} />
          <RecentComments comments={recentComments} />
        </aside>
      </div>
    </div>
  );
}

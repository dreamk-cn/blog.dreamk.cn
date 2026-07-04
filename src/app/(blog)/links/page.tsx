import type { Metadata } from "next";
import { FriendLinkApplyForm } from "@/components/friend-link/friend-link-apply-form";
import { FriendLinkGrid } from "@/components/friend-link/friend-link-grid";
import { FriendLinkHero } from "@/components/friend-link/friend-link-hero";
import { siteConfig } from "@/config/site";
import { buildCanonical, buildIndexRobots } from "@/lib/seo";
import { listApprovedFriendLinks } from "@/services/friend-link-service";

export const metadata: Metadata = {
  title: "友链",
  description: `浏览 ${siteConfig.name} 的友情链接，了解互换友链的方式并提交申请。`,
  alternates: buildCanonical("/links"),
  robots: buildIndexRobots(),
};

export default async function LinksPage() {
  const friendLinks = await listApprovedFriendLinks();

  return (
    <div className="min-h-full bg-linear-to-b from-canvas/50 via-background to-background text-text-base">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:pt-6">
        <main className="space-y-8">
          <FriendLinkHero count={friendLinks.length} />
          <FriendLinkGrid items={friendLinks} />
          <FriendLinkApplyForm />
        </main>
      </div>
    </div>
  );
}

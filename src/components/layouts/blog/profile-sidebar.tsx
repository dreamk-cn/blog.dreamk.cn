"use client";

import { Avatar, Card, Separator } from "@heroui/react";
import { AppLink } from "@/components/ui/app-link";
import { siteConfig } from "@/config/site";
import { ClientChip } from "@/components/ui/heroui-client";
import type { Category } from "@/generated/prisma";
import { getTagColor } from "@/lib/tag-color";

type FriendLinkItem = {
  id: string;
  name: string;
  url: string;
};

export function ProfileSidebar({
  categories,
  friendLinks,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
  friendLinks: FriendLinkItem[];
}) {

  return (
    <Card className="overflow-hidden shadow-sm bg-background">
      <Card.Content className="p-6 text-center">
        <div className="mx-auto mb-4">
          <Avatar color="accent" className="mx-auto h-24 w-24 border border-default-200 text-large shadow-sm">
            <Avatar.Image src={siteConfig.avatar} alt="" />
            <Avatar.Fallback>{siteConfig.name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
        </div>
        <h2 className="text-[28px] font-semibold leading-none text-text-base">{siteConfig.name}&apos;s Blog</h2>
        <p className="mt-3 text-sm text-text-muted">Web Developer & Designer</p>
        <div className="mt-4 flex justify-center gap-3 text-sm text-text-base">
          <AppLink
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-accent"
          >
            github ↗
          </AppLink>
        </div>
      </Card.Content>

      <Separator />

      <Card.Content className="px-4 py-4">
        <div className="mb-3 text-md font-semibold text-text-base">分类</div>
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <span className="text-sm text-text-muted">暂无分类</span>
          ) : (
            categories.map((category) => (
              <AppLink key={category.id} href={`/categories/${category.slug}`}>
                <ClientChip variant="soft" color={getTagColor(category.name)}>
                  <ClientChip.Label>{category.name}</ClientChip.Label>
                </ClientChip>
              </AppLink>
            ))
          )}
        </div>
      </Card.Content>

      <Separator />

      <Card.Content className="p-4">
        <div className="mb-3 text-md font-semibold text-text-base">友链</div>
        <div className="flex flex-wrap gap-x-3 gap-y-2 px-1 text-sm">
          {friendLinks.length === 0 ? (
            <span className="text-sm text-text-muted">暂无友链</span>
          ) : (
            friendLinks.map((item) => (
              <AppLink
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-text-muted transition-colors hover:text-accent"
                key={item.id}
              >
                {item.name}
              </AppLink>
            ))
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

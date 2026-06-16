"use client";

import { Avatar, Card, Separator } from "@heroui/react";
import { AppLink } from "@/components/ui/app-link";
import { siteConfig } from "@/config/site";
import { ClientChip } from "@/components/ui/heroui-client";
import type { Category, Tag } from "@/generated/prisma";
import { getTagColor } from "@/lib/tag-color";
import { tagPath } from "@/lib/site-url";

type FriendLinkItem = {
  id: string;
  name: string;
  url: string;
};

const sectionClass = "flex min-h-0 shrink grow-0 basis-auto flex-col";
const scrollAreaClass = "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1";

export function ProfileSidebar({
  categories,
  tags,
  friendLinks,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
  tags: Pick<Tag, "id" | "name" | "slug">[];
  friendLinks: FriendLinkItem[];
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden bg-background">
      <Card.Content className="shrink-0 grow-0 px-4 py-5 text-center">
        <div className="mx-auto mb-3">
          <Avatar color="accent" className="mx-auto h-20 w-20 border border-default-200 text-large shadow-sm">
            <Avatar.Image src={siteConfig.avatar} alt="" />
            <Avatar.Fallback>{siteConfig.name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
        </div>
        <h2 className="text-2xl font-semibold leading-tight text-text-base">{siteConfig.name}&apos;s Blog</h2>
        <p className="mt-2 text-sm text-text-muted">Web Developer & Designer</p>
        <div className="mt-3 flex justify-center gap-3 text-sm text-text-base">
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

      <div className="flex min-h-0 flex-1 flex-col">
        <Card.Content className={`${sectionClass} px-4 py-4`}>
          <div className="mb-3 shrink-0 text-md font-semibold text-text-base">分类</div>
          <div className={scrollAreaClass}>
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
          </div>
        </Card.Content>

        <Separator />

        <Card.Content className={`${sectionClass} px-4 py-4`}>
          <div className="mb-3 shrink-0 text-md font-semibold text-text-base">标签</div>
          <div className={scrollAreaClass}>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-sm text-text-muted">暂无标签</span>
              ) : (
                tags.map((tag) => (
                  <AppLink key={tag.id} href={tagPath(tag.slug)}>
                    <ClientChip variant="soft" color={getTagColor(tag.name)}>
                      <ClientChip.Label>{tag.name}</ClientChip.Label>
                    </ClientChip>
                  </AppLink>
                ))
              )}
            </div>
          </div>
        </Card.Content>

        <Separator />

        <Card.Content className={`${sectionClass} p-4`}>
          <div className="mb-3 shrink-0 text-md font-semibold text-text-base">友链</div>
          <div className={scrollAreaClass}>
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
          </div>
        </Card.Content>
      </div>
    </Card>
  );
}

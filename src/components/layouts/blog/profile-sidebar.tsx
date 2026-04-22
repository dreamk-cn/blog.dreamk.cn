"use client";

import { Avatar, Card, Separator } from "@heroui/react";
import NextLink from "next/link";
import { siteConfig } from "@/config/site";
import { ClientChip } from "@/components/ui/heroui-client";
import { getTagColor } from "@/lib/tag-color";
import type { Tag } from "@prisma/client";

export function ProfileSidebar({ tagCloud }: { tagCloud: Tag[] }) {
  const friendLinks = [
    { name: "木小沫", url: "https://github.com/dreamk-cn" },
    { name: "google", url: "https://www.google.com" },
    { name: "百度云", url: "https://www.baidu.com" },
    { name: "bilibili", url: "https://www.bilibili.com" },
    { name: "百度", url: "https://www.baidu.com" },
    { name: "淘宝", url: "https://www.taobao.com" }
  ];

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
        <div className="mt-4 flex justify-center gap-3 text-sm text-default-600">
          <NextLink
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-accent"
          >
            github ↗
          </NextLink>
        </div>
      </Card.Content>

      <Separator />

      <Card.Content className="px-4 py-4">
        <div className="mb-3 text-md font-semibold text-text-base">标签</div>
        <div className="flex flex-wrap gap-2">
          {tagCloud.map((tag) => (
            <ClientChip key={tag.id} color={getTagColor(tag.name)} variant="soft" size="sm">
              <ClientChip.Label>{tag.name}</ClientChip.Label>
            </ClientChip>
          ))}
        </div>
      </Card.Content>

      <Separator />

      <Card.Content className="p-4">
        <div className="mb-3 text-md font-semibold text-text-base">友链</div>
        <div className="flex flex-wrap gap-x-3 gap-y-2 px-1 text-sm">
          {friendLinks.map((item) => (
            <NextLink
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-text-muted transition-colors hover:text-accent"
              key={item.name}
            >
              {item.name}
            </NextLink>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

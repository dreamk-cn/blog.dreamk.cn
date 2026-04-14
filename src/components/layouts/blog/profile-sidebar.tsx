"use client";

import { Avatar, Card, CardBody, Divider, Link } from "@heroui/react";
import NextLink from "next/link";
import { siteConfig } from "@/config/site";
import { ClientChip } from "@/components/ui/client-chip";
import { getTagColor } from "@/lib/tag-color";
import type { Tag } from "@prisma/client";

export function ProfileSidebar({ tagCloud }: { tagCloud: Tag[] }) {
  return (
    <Card className="overflow-hidden" shadow="sm">
      <CardBody className="p-6 text-center">
        <div className="mx-auto mb-4">
          <Avatar 
            src={siteConfig.avatar} 
            className="w-24 h-24 text-large mx-auto shadow-sm border border-default-200"
            isBordered
            color="primary"
          />
        </div>
        <h2 className="text-[28px] font-semibold leading-none">{siteConfig.name}&apos;s Blog</h2>
        <p className="mt-3 text-sm text-default-500">Web Developer & Designer</p>
        <div className="mt-4 flex justify-center gap-3 text-sm text-default-600">
            <Link 
              as={NextLink} 
              href={siteConfig.links.github} 
              target="_blank" 
              className="inline-flex items-center gap-1.5"
              color="foreground"
              showAnchorIcon
            >
              github
            </Link>
            <Link 
              as={NextLink} 
              href="https://www.bilibili.com" 
              target="_blank" 
              className="inline-flex items-center gap-1.5"
              color="foreground"
              showAnchorIcon
            >
              bilibili
            </Link>
        </div>
      </CardBody>

      <Divider />

      <CardBody className="px-4 py-4">
        <div className="mb-3 text-sm font-semibold text-default-700">标签</div>
        <div className="flex flex-wrap gap-2">
          {tagCloud.map((tag) => (
            <ClientChip key={tag.id} color={getTagColor(tag.name)}>
              {tag.name}
            </ClientChip>
          ))}
        </div>
      </CardBody>

      <Divider />

      <CardBody className="p-4">
        <div className="mb-3 text-sm font-semibold text-default-700">友链</div>
        <div className="flex flex-col gap-2 text-sm">
          <Link 
            as={NextLink} 
            href="https://github.com/dreamk-cn" 
            target="_blank" 
            color="foreground"
            className="text-sm"
          >
            木小沫
          </Link>
          <Link 
            as={NextLink} 
            href="https://www.google.com" 
            target="_blank" 
            color="foreground"
            className="text-sm"
          >
            google
          </Link>
          <Link 
            as={NextLink} 
            href="https://www.baidu.com" 
            target="_blank" 
            color="foreground"
            className="text-sm"
          >
            百度云
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

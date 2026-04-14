"use client";

import { Avatar, Card, CardBody, Divider, Link } from "@heroui/react";
import NextLink from "next/link";
import { siteConfig } from "@/config/site";
import { ClientChip } from "@/components/ui/client-chip";
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
            showAnchorIcon
          >
            github
          </Link>
        </div>
      </CardBody>

      <Divider />

      <CardBody className="px-4 py-4">
        <div className="mb-3 text-md font-semibold text-default-700">标签</div>
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
        <div className="mb-3 text-md font-semibold text-default-700">友链</div>
        <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm px-1">
          {friendLinks.map((item) => (
            <Link
              as={NextLink}
              href={item.url}
              target="_blank"
              className="text-sm text-default-500 hover:text-primary transition-colors"
              key={item.name}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

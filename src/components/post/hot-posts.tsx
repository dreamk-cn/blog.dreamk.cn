"use client";

import { Card } from "@heroui/react";
import NextLink from "next/link";

type HotPost = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
};

export function HotPosts({ posts }: { posts: HotPost[] }) {
  return (
    <Card className="shadow-sm">
      <Card.Header className="border-b border-default-200/70 px-4 py-3">
        <span className="text-md font-bold text-default-700">热门文章列表</span>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3 p-4">
        {posts.map((post, index) => (
          <div key={post.id} className="flex items-start justify-between gap-3">
            <NextLink
              href={`/posts/${post.slug}`}
              className="line-clamp-2 text-sm hover:text-accent"
            >
              {post.title}
            </NextLink>
            <span className="inline-flex whitespace-nowrap rounded-full bg-default-100 px-2 py-0.5 text-xs text-default-500">
              {index + 1}
            </span>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-default-500">暂无热门文章</p>
        )}
      </Card.Content>
    </Card>
  );
}

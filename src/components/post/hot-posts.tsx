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
    <Card className="border border-border bg-background shadow-sm">
      <Card.Header className="border-b border-border px-4 py-3">
        <span className="text-md font-bold text-text-base">热门文章列表</span>
      </Card.Header>
      <Card.Content className="flex flex-col p-2">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-canvas"
          >
            <span className="w-8 shrink-0 text-center text-2xl leading-none font-light text-text-sub">
              {String(index + 1).padStart(2, "0")}
            </span>
            <NextLink
              href={`/posts/${post.slug}`}
              className="line-clamp-1 flex-1 text-sm text-text-base transition-colors group-hover:text-primary"
            >
              {post.title}
            </NextLink>
            <span className="shrink-0 whitespace-nowrap text-xs text-text-muted">
              浏览 {post.viewCount}
            </span>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-text-muted">暂无热门文章</p>
        )}
      </Card.Content>
    </Card>
  );
}

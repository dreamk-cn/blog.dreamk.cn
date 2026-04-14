"use client";

import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import NextLink from "next/link";

type HotPost = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
};

export function HotPosts({ posts }: { posts: HotPost[] }) {
  return (
    <Card shadow="sm">
      <CardHeader className="px-4 py-3 border-b border-default-200/70">
        <span className="font-semibold text-default-700">热门文章列表</span>
      </CardHeader>
      <CardBody className="p-4 flex flex-col gap-3">
        {posts.map((post, index) => (
          <div key={post.id} className="flex items-start justify-between gap-3">
            <Link 
              as={NextLink} 
              href={`/posts/${post.slug}`} 
              className="line-clamp-2 text-sm"
              color="foreground"
            >
              {post.title}
            </Link>
            <span className="inline-flex whitespace-nowrap rounded-full bg-default-100 px-2 py-0.5 text-xs text-default-500">
              {index + 1}
            </span>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-default-500">暂无热门文章</p>
        )}
      </CardBody>
    </Card>
  );
}

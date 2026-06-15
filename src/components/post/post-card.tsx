"use client";

import { ClientChip } from "../ui/heroui-client";
import { PostCover } from "@/components/post/post-cover";
import { getTagColor } from "@/lib/tag-color";
import { AppLink } from "@/components/ui/app-link";
import { Card } from "@heroui/react";
import { getPrimaryCoverUrl, type CoverMediaItem } from "@/lib/post-cover";
import { formatDate } from "@/lib/format-datetime";
import { postPath, tagPath } from "@/lib/site-url";
import type { Post, Tag } from "@/generated/prisma";

type PostWithTags = Post & {
  tags: Tag[];
  coverMedia?: CoverMediaItem[];
};

export function PostCard({ post }: { post: PostWithTags }) {
  const postHref = postPath(post.slug);

  return (
    <Card className="group overflow-hidden p-0 shadow-sm transition-shadow hover:shadow-md">
      <AppLink href={postHref} className="block">
        <PostCover coverUrl={getPrimaryCoverUrl(post.coverMedia)} alt={post.title} variant="card" />
      </AppLink>
      <Card.Header className="flex-col items-start px-5 pb-0 pt-4">
        <AppLink
          href={postHref}
          className="line-clamp-1 text-2xl/normal font-semibold tracking-tight text-text-base transition-colors hover:text-primary"
        >
          {post.title}
        </AppLink>
      </Card.Header>
      <Card.Content className="px-5">
        <p className="line-clamp-3 text-sm leading-7 text-text-muted">
          {post.excerpt || post.content || "暂无摘要"}
        </p>
      </Card.Content>
      <Card.Footer className="flex items-center justify-between gap-1 border-t border-border px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            浏览 {post.viewCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            发布于 {formatDate(post.publishedAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {post.tags.slice(0, 3).map((tag) => (
            <AppLink key={tag.id} href={tagPath(tag.slug)}>
              <ClientChip color={getTagColor(tag.name)} variant="soft" size="sm">
                <ClientChip.Label>{tag.name}</ClientChip.Label>
              </ClientChip>
            </AppLink>
          ))}
        </div>
      </Card.Footer>
    </Card>
  );
}

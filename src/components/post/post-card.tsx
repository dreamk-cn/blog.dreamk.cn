"use client";

import { FolderIcon } from "@/components/icons";
import { PostCover } from "@/components/post/post-cover";
import { PostFeaturedBadge } from "@/components/post/post-featured-badge";
import { getTagColor } from "@/lib/tag-color";
import { AppLink } from "@/components/ui/app-link";
import { Card, Chip, Separator } from "@heroui/react";
import { getPrimaryCoverUrl, type CoverMediaItem } from "@/lib/post-cover";
import { formatDate } from "@/lib/format-datetime";
import { postPath, tagPath, categoryPath } from "@/lib/site-url";
import type { Category, Post, Tag } from "@/generated/prisma";

type PostWithTags = Post & {
  tags: Tag[];
  category?: Category | null;
  coverMedia?: CoverMediaItem[];
};

export function PostCard({ post }: { post: PostWithTags }) {
  const postHref = postPath(post.slug);
  const isFeatured = post.featured;

  return (
    <Card className="group overflow-hidden p-0 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <AppLink href={postHref} className="block">
          <PostCover coverUrl={getPrimaryCoverUrl(post.coverMedia)} alt={post.title} variant="card" />
        </AppLink>
        {isFeatured ? (
          <div className="pointer-events-none absolute left-3 top-3 z-10">
            <PostFeaturedBadge />
          </div>
        ) : null}
      </div>
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
        <div className="flex min-w-0 items-center gap-1">
          {post.category && (
            <>
              <AppLink href={categoryPath(post.category.slug)}>
                <Chip color={getTagColor(post.category.name)} variant="soft" size="sm">
                  <Chip.Label className="inline-flex items-center gap-0.5">
                    <FolderIcon size={10} className="shrink-0" />
                    {post.category.name}
                  </Chip.Label>
                </Chip>
              </AppLink>
              {post.tags.length > 0 && (
                <Separator orientation="vertical" className="mx-1 h-4 shrink-0 self-center" />
              )}
            </>
          )}
          {post.tags.slice(0, 3).map((tag) => (
            <AppLink key={tag.id} href={tagPath(tag.slug)}>
              <Chip color={getTagColor(tag.name)} variant="soft" size="sm">
                <Chip.Label>{tag.name}</Chip.Label>
              </Chip>
            </AppLink>
          ))}
        </div>
      </Card.Footer>
    </Card>
  );
}

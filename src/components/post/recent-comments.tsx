"use client";

import { Card } from "@heroui/react";
import { stripMarkdownPreview } from "@/lib/strip-markdown-preview";
import { postPathWithCommentAnchor } from "@/lib/comment-anchor";
import { postPath } from "@/lib/site-url";
import { formatDate } from "@/lib/format-datetime";
import { AppLink } from "@/components/ui/app-link";

type RecentComment = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: {
    name: string | null;
    image: string | null;
  } | null;
  post: {
    title: string;
    slug: string;
  };
};

export function RecentComments({ comments }: { comments: RecentComment[] }) {
  return (
    <Card className="border border-border bg-background shadow-sm">
      <Card.Header className="border-b border-border px-4 py-3">
        <span className="text-md font-bold text-text-base">最近留言</span>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1 p-2">
        {comments.map((comment) => {
          const authorName = comment.user?.name?.trim() || "匿名访客";
          const href = postPathWithCommentAnchor(postPath(comment.post.slug), comment.id);

          return (
            <AppLink
              key={comment.id}
              href={href}
              scroll={false}
              className="group block rounded-xl px-2 py-2 transition-colors hover:bg-canvas"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                <span className="truncate font-medium text-text-base group-hover:text-primary">
                  {authorName}
                </span>
                <time className="shrink-0 whitespace-nowrap" dateTime={new Date(comment.createdAt).toISOString()}>
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-text-base">
                {stripMarkdownPreview(comment.content)}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-text-muted group-hover:text-primary">
                《{comment.post.title}》
              </p>
            </AppLink>
          );
        })}
        {comments.length === 0 && <p className="px-2 py-1 text-sm text-text-muted">暂无留言</p>}
      </Card.Content>
    </Card>
  );
}

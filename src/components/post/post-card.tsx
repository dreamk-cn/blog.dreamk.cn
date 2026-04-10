import Link from "next/link";
import type { Post, Tag } from "@prisma/client";

type PostWithTags = Post & { tags: Tag[] };

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function PostCard({ post }: { post: PostWithTags }) {
  return (
    <article className="rounded-md border border-default-200/70 bg-content1 p-4 hover:shadow-md transition-shadow">
      <header className="pb-2">
        <Link href={`/posts/${post.slug}`} className="text-xl font-semibold hover:text-primary transition-colors line-clamp-1">
          {post.title}
        </Link>
      </header>
      <div className="pt-1 pb-2">
        <p className="text-default-600 text-sm leading-7 line-clamp-3 min-h-[84px]">
          {post.excerpt || post.content || "暂无摘要"}
        </p>
      </div>
      <footer className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 text-xs text-default-500">
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.viewCount} 阅读</span>
        </div>
        <div className="flex items-center gap-1">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag.id} className="text-xs px-2 py-1 rounded-full bg-default-100 text-default-600">
              {tag.name}
            </span>
          ))}
        </div>
      </footer>
    </article>
  )
}
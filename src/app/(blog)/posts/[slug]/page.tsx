import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { ArticleMarkdown } from "@/components/post/article-markdown";
import { PostComments } from "@/components/post/post-comments";
import { MobilePostToc, PostViewTracker } from "@/components/post/mobile-post-toc";
import { PostTocActiveProvider } from "@/components/post/post-toc-active-context";
import { PostTableOfContents } from "@/components/post/post-table-of-contents";
import { estimateArticleCharCount, extractMarkdownToc } from "@/lib/markdown-toc";
import { prisma } from "@/libs/prisma";
import { listApprovedCommentsBySlug } from "@/services/comment-service";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDateTime(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function getPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      tags: true,
      category: true,
      user: { select: { name: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      excerpt: true,
    },
  });

  if (!post) {
    return {
      title: "文章不存在",
      description: "该文章可能已被删除或暂未发布",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || "博客文章详情",
  };
}

export default async function PostDetail({ params }: PageProps) {
  const { slug } = await params;
  const [post, comments] = await Promise.all([getPostBySlug(slug), listApprovedCommentsBySlug(slug)]);

  if (!post) {
    notFound();
  }

  const content = post.content || "";
  const toc = extractMarkdownToc(content);
  const charCount = estimateArticleCharCount(content);
  const published = post.publishedAt ?? post.createdAt;
  const authorName = post.user?.name?.trim() || siteConfig.name;

  return (
    <div className="min-h-full bg-gradient-to-b from-foreground/60 via-background to-background text-text-base">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <PostTocActiveProvider items={toc}>
          <PostViewTracker slug={slug} />
          <MobilePostToc items={toc} />
          <div className="mx-auto max-w-3xl">
            <div>
              <article className="rounded-2xl border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="border-b border-border px-6 py-8 sm:px-10 sm:py-10">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-base sm:text-4xl">{post.title}</h1>

                  <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-text-muted">
                    <span className="whitespace-nowrap">{formatDateTime(published)}</span>
                    <span className="mx-2 hidden text-text-sub sm:inline">·</span>
                    <span className="whitespace-nowrap">{post.viewCount} 浏览</span>
                    <span className="mx-2 hidden text-text-sub sm:inline">·</span>
                    <span className="whitespace-nowrap">{charCount} 字</span>
                    <span className="mx-2 hidden text-text-sub sm:inline">·</span>
                    <span className="whitespace-nowrap">
                      作者：<span className="text-text-base">{authorName}</span>
                    </span>
                    {post.category && (
                      <>
                        <span className="mx-2 hidden text-text-sub sm:inline">·</span>
                        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-text-base">
                          {post.category.name}
                        </span>
                      </>
                    )}
                  </div>

                  {post.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-text-sub">标签</span>
                      {post.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-6 py-8 pt-0! sm:px-10 sm:py-10">
                  <ArticleMarkdown content={content} />
                </div>
              </article>
              <PostComments
                slug={slug}
                initialComments={comments.map((comment) => ({
                  id: comment.id,
                  content: comment.content,
                  parentId: comment.parentId,
                  createdAt: comment.createdAt.toISOString(),
                  user: comment.user,
                  replyTo: comment.replyTo,
                  replies: comment.replies.map((reply) => ({
                    id: reply.id,
                    content: reply.content,
                    parentId: reply.parentId,
                    createdAt: reply.createdAt.toISOString(),
                    user: reply.user,
                    replyTo: reply.replyTo,
                    replies: [],
                  })),
                }))}
              />
            </div>
          </div>

          <aside className="fixed left-1/2 top-28 z-20 hidden h-[calc(100vh-7.5rem)] w-[280px] min-h-0 -translate-x-0 ml-[27rem] 2xl:block">
            <div className="flex max-h-full flex-col rounded-2xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <h2 className="mb-3 shrink-0 text-sm font-semibold tracking-wide text-text-base">目录</h2>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                <PostTableOfContents items={toc} />
              </div>
            </div>
          </aside>
        </PostTocActiveProvider>
      </div>
    </div>
  );
}

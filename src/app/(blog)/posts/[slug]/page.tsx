import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { ArticleMarkdown } from "@/components/post/article-markdown";
import { PostCoverGallery } from "@/components/post/post-cover-gallery";
import { getCoverUrls } from "@/lib/post-cover";
import { PostComments } from "@/components/post/comment";
import { MobilePostToc, PostViewTracker } from "@/components/post/mobile-post-toc";
import { PostTocActiveProvider } from "@/components/post/post-toc-active-context";
import { PostTableOfContents } from "@/components/post/post-table-of-contents";
import { estimateArticleCharCount, extractMarkdownToc } from "@/lib/markdown-toc";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCanonical,
  getMetadataBase,
  normalizeMetaDescription,
  stringifyJsonLd,
} from "@/lib/seo";
import { countApprovedCommentsByPostSlug, listApprovedCommentsBySlug } from "@/services/comment-service";
import { getPublishedPostBySlug } from "@/services/post-service";

const POST_COMMENT_ROOT_PAGE_SIZE = 20;
const POST_COMMENT_REPLY_PAGE_SIZE = 5;
export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDateTime(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const getCachedPublishedPostBySlug = cache(getPublishedPostBySlug);

function buildPostDescription(post: NonNullable<Awaited<ReturnType<typeof getPublishedPostBySlug>>>) {
  if (post.excerpt?.trim()) {
    return normalizeMetaDescription(post.excerpt);
  }

  const parts = [
    post.title,
    post.category?.name ? `分类：${post.category.name}` : null,
    `作者：${post.user?.name?.trim() || siteConfig.name}`,
  ].filter(Boolean);

  return normalizeMetaDescription(parts.join("，"));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const coverUrls = getCoverUrls(post.coverMedia);

  return {
    title: post.title,
    description: buildPostDescription(post),
    alternates: buildCanonical(`/posts/${encodeURIComponent(post.slug)}`),
    ...(coverUrls.length > 0
      ? {
          openGraph: {
            images: coverUrls.map((cover) => ({
              url: cover.startsWith("http") ? cover : new URL(cover, getMetadataBase()).toString(),
            })),
          },
        }
      : {}),
  };
}

export default async function PostDetail({ params }: PageProps) {
  const { slug } = await params;
  const post = await getCachedPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [commentBundle, totalApprovedCommentCount] = await Promise.all([
    listApprovedCommentsBySlug(slug, {
      rootSkip: 0,
      rootTake: POST_COMMENT_ROOT_PAGE_SIZE,
      replySkip: 0,
      replyTake: POST_COMMENT_REPLY_PAGE_SIZE,
    }),
    countApprovedCommentsByPostSlug(slug),
  ]);
  const { comments, totalRootCount } = commentBundle;

  const content = post.content || "";
  const toc = extractMarkdownToc(content);
  const charCount = estimateArticleCharCount(content);
  const published = post.publishedAt ?? post.createdAt;
  const authorName = post.user?.name?.trim() || siteConfig.name;
  const description = buildPostDescription(post);
  const articleJsonLd = buildArticleJsonLd({
    title: post.title,
    description,
    path: `/posts/${encodeURIComponent(post.slug)}`,
    authorName,
    publishedAt: published,
    modifiedAt: post.updatedAt ?? published,
    categoryName: post.category?.name,
    coverUrls: getCoverUrls(post.coverMedia),
    tags: post.tags.map((tag) => tag.name),
  });
  const breadcrumbItems = [
    { name: "首页", path: "/" },
    { name: "文章", path: "/posts" },
    ...(post.category
      ? [{ name: post.category.name, path: `/categories/${encodeURIComponent(post.category.slug)}` }]
      : []),
    { name: post.title, path: `/posts/${encodeURIComponent(post.slug)}` },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);

  return (
    <div className="min-h-full bg-gradient-to-b from-canvas/60 via-background to-background text-text-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <PostTocActiveProvider items={toc}>
          <PostViewTracker slug={slug} />
          <MobilePostToc items={toc} />
          <div className="mx-auto max-w-3xl">
            <div>
              <article className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <PostCoverGallery
                  coverMedia={post.coverMedia}
                  alt={post.title}
                  variant="hero"
                  priority
                  className="rounded-none border-b border-border"
                />
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
                        <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-text-base">
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

                <div className="px-6 py-8 sm:px-10 sm:py-10">
                  <ArticleMarkdown content={content} />
                </div>
              </article>
              <PostComments
                key={slug}
                slug={slug}
                rootPageSize={POST_COMMENT_ROOT_PAGE_SIZE}
                replyPageSize={POST_COMMENT_REPLY_PAGE_SIZE}
                initialTotalRootCount={totalRootCount}
                totalApprovedCommentCount={totalApprovedCommentCount}
                initialComments={comments.map((comment) => ({
                  id: comment.id,
                  content: comment.content,
                  parentId: comment.parentId,
                  createdAt: comment.createdAt.toISOString(),
                  user: comment.user,
                  replyTo: comment.replyTo,
                  totalReplyCount: comment.totalReplyCount,
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

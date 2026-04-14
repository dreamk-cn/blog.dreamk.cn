import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { ArticleMarkdown } from "@/components/post/article-markdown";
import { MobilePostToc, PostViewTracker } from "@/components/post/mobile-post-toc";
import { PostTocActiveProvider } from "@/components/post/post-toc-active-context";
import { PostTableOfContents } from "@/components/post/post-table-of-contents";
import { estimateArticleCharCount, extractMarkdownToc } from "@/lib/markdown-toc";
import { prisma } from "@/libs/prisma";

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
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const content = post.content || "";
  const toc = extractMarkdownToc(content);
  const charCount = estimateArticleCharCount(content);
  const published = post.publishedAt ?? post.createdAt;
  const authorName = post.user?.name?.trim() || siteConfig.name;

  return (
    <div className="min-h-full bg-gradient-to-b from-default-100/50 via-background to-background dark:from-default-50/5">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:max-w-7xl lg:px-8 lg:pt-10">
        <nav className="mb-8 text-sm text-default-500">
          <Link href="/" className="transition-colors hover:text-primary">
            首页
          </Link>
          <span className="mx-2 text-default-300">/</span>
          <Link href="/posts" className="transition-colors hover:text-primary">
            博客
          </Link>
          <span className="mx-2 text-default-300">/</span>
          <span className="text-default-700">{post.title}</span>
        </nav>

        <PostTocActiveProvider items={toc}>
          <PostViewTracker slug={slug} />
          <MobilePostToc items={toc} />
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-stretch xl:gap-10">
            <article className="rounded-2xl border border-default-200/70 bg-content1 shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:border-default-100/20 dark:bg-content1/60 dark:shadow-none">
              <div className="border-b border-default-200/60 px-6 py-8 sm:px-10 sm:py-10 dark:border-default-100/15">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">{post.title}</h1>

                <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-default-500">
                  <span className="whitespace-nowrap">{formatDateTime(published)}</span>
                  <span className="mx-2 hidden text-default-300 sm:inline">·</span>
                  <span className="whitespace-nowrap">{post.viewCount} 浏览</span>
                  <span className="mx-2 hidden text-default-300 sm:inline">·</span>
                  <span className="whitespace-nowrap">{charCount} 字</span>
                  <span className="mx-2 hidden text-default-300 sm:inline">·</span>
                  <span className="whitespace-nowrap">
                    作者：<span className="text-default-700">{authorName}</span>
                  </span>
                  {post.category && (
                    <>
                      <span className="mx-2 hidden text-default-300 sm:inline">·</span>
                      <span className="rounded-full bg-default-100 px-2.5 py-0.5 text-xs font-medium text-default-700 dark:bg-default-100/15">
                        {post.category.name}
                      </span>
                    </>
                  )}
                </div>

                {post.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-default-400">标签</span>
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20"
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

            <aside className="relative hidden min-h-0 xl:block">
              <div className="sticky top-28 flex max-h-[calc(100vh-7.5rem)] flex-col rounded-2xl border border-default-200/70 bg-content1 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:border-default-100/20 dark:bg-content1/60 dark:shadow-none">
                <h2 className="mb-3 shrink-0 text-sm font-semibold tracking-wide text-foreground">目录</h2>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                  <PostTableOfContents items={toc} />
                </div>
              </div>
            </aside>
          </div>
        </PostTocActiveProvider>
      </div>
    </div>
  );
}

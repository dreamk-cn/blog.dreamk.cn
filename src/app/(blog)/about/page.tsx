import type { Metadata } from "next";
import Link from "next/link";
import { ArticleMarkdown } from "@/components/post/article-markdown";
import { PostComments } from "@/components/post/comment";
import { contentConfig } from "@/config/content";
import { siteConfig } from "@/config/site";
import { buildCanonical } from "@/lib/seo";
import { countApprovedCommentsByPostSlug, listApprovedCommentsBySlug } from "@/services/comment-service";
import { getPublishedPostBySlug, getPublishedPostMetadataBySlug } from "@/services/post-service";

const ABOUT_SLUG = contentConfig.pageSlugs.about;
const ROOT_PAGE_SIZE = 20;
const REPLY_PAGE_SIZE = 5;

/** ISR：约 10 分钟重新生成，发布后最多延迟一小段时间可见（可按需改成 300/900） */
export const revalidate = 600;

function formatDateTime(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function getAboutPost() {
  return getPublishedPostBySlug(ABOUT_SLUG);
}

type AboutPageData =
  | {
    status: "ok";
    post: NonNullable<Awaited<ReturnType<typeof getAboutPost>>>;
    commentBundle: Awaited<ReturnType<typeof listApprovedCommentsBySlug>>;
    totalApprovedCommentCount: number;
  }
  | { status: "not_found" }
  | { status: "db_error" };

async function getAboutPageDataSafe(): Promise<AboutPageData> {
  try {
    const [post, commentBundle, totalApprovedCommentCount] = await Promise.all([
      getAboutPost(),
      listApprovedCommentsBySlug(ABOUT_SLUG, {
        rootSkip: 0,
        rootTake: ROOT_PAGE_SIZE,
        replySkip: 0,
        replyTake: REPLY_PAGE_SIZE,
      }),
      countApprovedCommentsByPostSlug(ABOUT_SLUG),
    ]);

    if (!post) {
      return { status: "not_found" };
    }

    return { status: "ok", post, commentBundle, totalApprovedCommentCount };
  } catch {
    return { status: "db_error" };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const post = await getPublishedPostMetadataBySlug(ABOUT_SLUG);

    if (!post) {
      return {
        title: "关于",
        description: siteConfig.description,
      alternates: buildCanonical("/about"),
      };
    }

    return {
      title: post.title,
      description: post.excerpt || siteConfig.description,
    alternates: buildCanonical("/about"),
    };
  } catch {
    return {
      title: "关于",
      description: siteConfig.description,
    alternates: buildCanonical("/about"),
    };
  }
}

export default async function AboutPage() {
  const data = await getAboutPageDataSafe();

  if (data.status === "db_error") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-semibold text-text-base">About 页面暂时不可用</h1>
          <p className="mt-3 text-sm text-text-muted">数据库连接异常，稍后刷新重试即可。</p>
          <Link href="/posts" className="mt-5 inline-block text-sm text-primary hover:underline">
            去看看其他文章
          </Link>
        </div>
      </div>
    );
  }

  if (data.status === "not_found") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-semibold text-text-base">About 页面尚未发布</h1>
          <p className="mt-3 text-sm text-text-muted">请在后台创建并发布 slug 为 about 的文章后再访问此页。</p>
          <Link href="/posts" className="mt-5 inline-block text-sm text-primary hover:underline">
            去看看其他文章
          </Link>
        </div>
      </div>
    );
  }

  const { post, commentBundle, totalApprovedCommentCount } = data;
  const { comments, totalRootCount } = commentBundle;
  const published = post.publishedAt ?? post.createdAt;
  const authorName = post.user?.name?.trim() || siteConfig.name;

  return (
    <div className="min-h-full bg-gradient-to-b from-foreground/60 via-background to-background text-text-base">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <article className="rounded-2xl border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <header className="border-b border-border px-6 py-8 sm:px-10 sm:py-10">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-base sm:text-4xl">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-text-muted">
              <span className="whitespace-nowrap">{formatDateTime(published)}</span>
              <span className="mx-2 hidden text-text-sub sm:inline">·</span>
              <span className="whitespace-nowrap">
                作者：<span className="text-text-base">{authorName}</span>
              </span>
            </div>
          </header>
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <ArticleMarkdown content={post.content || ""} />
          </div>
        </article>

        <PostComments
          key={ABOUT_SLUG}
          slug={ABOUT_SLUG}
          rootPageSize={ROOT_PAGE_SIZE}
          replyPageSize={REPLY_PAGE_SIZE}
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
  );
}
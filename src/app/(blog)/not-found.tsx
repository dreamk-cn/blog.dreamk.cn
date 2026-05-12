import Link from "next/link";

export default function BlogNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-base">页面未找到</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">
        该文章不存在、尚未发布，或链接已失效。
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          href="/"
        >
          返回首页
        </Link>
        <Link
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-text-base shadow-sm transition-colors hover:border-primary hover:text-primary"
          href="/posts"
        >
          文章列表
        </Link>
      </div>
    </div>
  );
}

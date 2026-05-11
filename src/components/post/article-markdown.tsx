"use client";

import type { ComponentProps } from "react";
import type { Components } from "react-markdown";
import { useMemo } from "react";
import ReactMarkdown, { MarkdownHooks } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const mdLink = "text-primary font-medium hover:underline underline-offset-2";

const prettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark-dimmed",
  },
  keepBackground: true,
  bypassInlineCode: true,
  defaultLang: "plaintext",
} as const;

function stringifyClassName(className: string | string[] | undefined): string {
  if (typeof className === "string") return className;
  if (Array.isArray(className)) return className.filter(Boolean).join(" ");
  return "";
}

const mdBase: Components = {
  h1: ({ children, className, ...props }) => (
    <h1 className={`mt-10 text-3xl font-bold tracking-tight text-text-base first:mt-0 ${className ?? ""}`} {...props}>
      {children}
    </h1>
  ),
  p: ({ children, className, ...props }) => (
    <p className={`mb-5 text-[15px] leading-8 text-default-700 ${className ?? ""}`} {...props}>
      {children}
    </p>
  ),
  ul: ({ children, className, ...props }) => (
    <ul className={`mb-5 list-disc space-y-2 pl-6 text-[15px] leading-8 text-default-700 ${className ?? ""}`} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, className, ...props }) => (
    <ol className={`mb-5 list-decimal space-y-2 pl-6 text-[15px] leading-8 text-default-700 ${className ?? ""}`} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => (
    <li className={`marker:text-default-400 ${className ?? ""}`} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, className, ...props }) => (
    <blockquote
      className={`my-6 border-l-4 border-primary/40 bg-default-100/60 py-3 pl-4 pr-4 text-default-700 italic dark:bg-default-100/10 ${className ?? ""}`}
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ children, className, ...props }) => (
    <a className={`${mdLink} ${className ?? ""}`} {...props}>
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const cls = stringifyClassName(className);
    const isBlock = cls.includes("language-");
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={`rounded-md bg-default-100 px-1.5 py-0.5 font-mono text-[13px] text-primary dark:text-primary ${cls}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, className, ...props }) => {
    const cls = stringifyClassName(className);
    const p = props as { dataLanguage?: string };
    /* rehype-pretty-code strips the `shiki` class from `pre`; rely on injected data-language */
    const isPrettyBlock = typeof p.dataLanguage === "string";
    if (isPrettyBlock) {
      return (
        <pre className={`m-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 text-[13px] leading-6 ${cls}`} {...props}>
          {children}
        </pre>
      );
    }
    return (
      <pre
        className={`overflow-x-auto rounded-xl border border-default-200/80 bg-default-100/80 p-4 text-[13px] leading-6 dark:bg-default-50/10 ${cls}`}
        {...props}
      >
        {children}
      </pre>
    );
  },
  figure: ({ children, className, ...props }) => (
    <figure
      className={`my-6 overflow-hidden rounded-xl border border-default-200/80 dark:border-default-100/15 ${className ?? ""}`}
      {...props}
    >
      {children}
    </figure>
  ),
  figcaption: ({ children, className, ...props }) => (
    <figcaption
      className={`border-b border-default-200/80 bg-default-100/70 px-4 py-2 text-left text-xs font-medium text-default-600 dark:border-default-100/15 dark:bg-default-100/20 dark:text-default-400 ${className ?? ""}`}
      {...props}
    >
      {children}
    </figcaption>
  ),
  hr: ({ className, ...props }) => <hr className={`my-10 border-default-200/80 ${className ?? ""}`} {...props} />,
  table: ({ children, className, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-default-200/80">
      <table className={`w-full min-w-[520px] border-collapse text-sm ${className ?? ""}`} {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, className, ...props }) => (
    <th className={`border-b border-default-200/80 bg-default-100/70 px-3 py-2 text-left font-semibold dark:bg-default-100/20 ${className ?? ""}`} {...props}>
      {children}
    </th>
  ),
  td: ({ children, className, ...props }) => (
    <td className={`border-b border-default-100 px-3 py-2 text-default-700 ${className ?? ""}`} {...props}>
      {children}
    </td>
  ),
  strong: ({ children, className, ...props }) => (
    <strong className={`font-semibold text-text-base ${className ?? ""}`} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, className, ...props }) => (
    <em className={`italic ${className ?? ""}`} {...props}>
      {children}
    </em>
  ),
  del: ({ children, className, ...props }) => (
    <del className={`text-default-400 line-through ${className ?? ""}`} {...props}>
      {children}
    </del>
  ),
  img: ({ className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt ?? ""}
      className={`my-6 h-auto max-w-full rounded-xl border border-default-200/60 object-contain dark:border-default-100/15 ${className ?? ""}`}
      {...props}
    />
  ),
};

export function ArticleMarkdown({ content }: { content: string }) {
  const attach = (Tag: "h2" | "h3" | "h4" | "h5" | "h6", classes: string) =>
    function Heading({ children, className, ...props }: ComponentProps<typeof Tag>) {
      const Comp = Tag;
      return (
        <Comp className={`${classes} ${className ?? ""}`} {...props}>
          {children}
        </Comp>
      );
    };

  const merged: Components = {
    ...mdBase,
    h2: attach("h2", "mt-12 scroll-mt-28 border-b border-default-200/80 pb-2 text-2xl font-bold tracking-tight text-text-base"),
    h3: attach("h3", "mt-10 scroll-mt-28 text-xl font-semibold tracking-tight text-text-base"),
    h4: attach("h4", "mt-8 scroll-mt-28 text-lg font-semibold text-text-base"),
    h5: attach("h5", "mt-6 scroll-mt-28 text-base font-semibold text-text-base"),
    h6: attach("h6", "mt-6 scroll-mt-28 text-sm font-semibold text-text-muted"),
  };

  const body = content || "暂无正文内容";

  const rehypeWithPretty = useMemo(
    () => [rehypeSlug, [rehypePrettyCode, prettyCodeOptions] as [typeof rehypePrettyCode, typeof prettyCodeOptions]],
    [],
  );
  const rehypeSlugOnly = useMemo(() => [rehypeSlug], []);
  const remark = useMemo(() => [remarkGfm], []);

  return (
    <div className="article-md">
      <MarkdownHooks
        remarkPlugins={remark}
        rehypePlugins={rehypeWithPretty}
        components={merged}
        fallback={
          <ReactMarkdown remarkPlugins={remark} rehypePlugins={rehypeSlugOnly} components={merged}>
            {body}
          </ReactMarkdown>
        }
      >
        {body}
      </MarkdownHooks>
    </div>
  );
}

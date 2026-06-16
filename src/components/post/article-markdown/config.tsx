import type { ComponentProps } from "react";
import type { Components } from "react-markdown";

/** react-markdown 传递 `node` 给自定义组件；永远不会转发到原生 DOM。 */
function withoutNodeProps<T extends Record<string, unknown>>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props as T & { node?: unknown };
  return rest;
}
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const mdLink = "text-primary font-medium hover:underline underline-offset-2";

export const prettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "one-dark-pro",
  },
  keepBackground: true,
  bypassInlineCode: true,
  defaultLang: "plaintext",
} as const;

export const articleRemarkPlugins = [remarkGfm];

export const articleRehypePlugins: [
  typeof rehypeSlug,
  [typeof rehypePrettyCode, typeof prettyCodeOptions],
] = [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]];

export const articleRehypeSlugOnly = [rehypeSlug];

function stringifyClassName(className: string | string[] | undefined): string {
  if (typeof className === "string") return className;
  if (Array.isArray(className)) return className.filter(Boolean).join(" ");
  return "";
}

/** hast uses `data-language` / `data-theme`; React may expose hyphen or camelCase */
function isPrettyCodeBlockProps(props: Record<string, unknown>): boolean {
  const lang = props["data-language"] ?? props.dataLanguage;
  const theme = props["data-theme"] ?? props.dataTheme;
  return typeof lang === "string" || typeof theme === "string";
}

const mdBase: Components = {
  h1: ({ children, className, ...props }) => (
    <h1 className={`scroll-mt-28 text-3xl font-bold tracking-tight text-text-base ${className ?? ""}`} {...props}>
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
      className={`mb-6 border-l-4 border-primary/40 bg-default-100/60 py-3 pl-4 pr-4 text-default-700 italic dark:bg-default-100/10 ${className ?? ""}`}
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ children, className, href, ...props }) => {
    const isInPageAnchor = typeof href === "string" && href.startsWith("#");
    return (
      <a
        className={`${mdLink} ${className ?? ""}`}
        href={href}
        {...(isInPageAnchor ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        {...props}
      >
        {children}
      </a>
    );
  },
  code: ({ className, children, ...props }) => {
    const domProps = withoutNodeProps(props as Record<string, unknown>);
    const cls = stringifyClassName(className);
    /* Fenced blocks from remark have language-*; Shiki replaces with class shiki + data-language (no language- ) */
    const isBlock =
      cls.includes("language-") || cls.split(/\s+/).includes("shiki") || isPrettyCodeBlockProps(domProps as Record<string, unknown>);
    if (isBlock) {
      return (
        <code className={className} {...domProps}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={`rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[13px] text-primary dark:text-primary ${cls}`}
        {...domProps}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, className, ...props }) => {
    const domProps = withoutNodeProps(props as Record<string, unknown>);
    const cls = stringifyClassName(className);
    const raw = domProps as Record<string, unknown>;
    const isPrettyBlock =
      typeof raw["data-language"] === "string" || typeof raw.dataLanguage === "string";
    if (isPrettyBlock) {
      return (
        <pre className={`m-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 text-[13px] leading-6 ${cls}`} {...domProps}>
          {children}
        </pre>
      );
    }
    return (
      <pre
        className={`mb-6 overflow-x-auto rounded-xl border border-default-200/80 bg-default-100/80 p-4 text-[13px] leading-6 dark:bg-default-50/10 ${cls}`}
        {...domProps}
      >
        {children}
      </pre>
    );
  },
  figure: ({ children, className, ...props }) => (
    <figure
      className={`mb-6 overflow-hidden rounded-xl border border-default-200/80 dark:border-default-100/15 ${className ?? ""}`}
      {...withoutNodeProps(props as Record<string, unknown>)}
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
  hr: ({ className, ...props }) => <hr className={`mb-10 border-default-200/80 ${className ?? ""}`} {...props} />,
  table: ({ children, className, ...props }) => (
    <div className="mb-6 overflow-x-auto rounded-xl border border-default-200/80">
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
      className={`mb-6 h-auto max-w-full rounded-xl border border-default-200/60 object-contain dark:border-default-100/15 ${className ?? ""}`}
      {...props}
    />
  ),
};

export function createArticleMarkdownComponents(): Components {
  const attach = (Tag: "h2" | "h3" | "h4" | "h5" | "h6", classes: string) =>
    function Heading({ children, className, ...props }: ComponentProps<typeof Tag>) {
      const Comp = Tag;
      return (
        <Comp className={`scroll-mt-28 ${classes} ${className ?? ""}`} {...props}>
          {children}
        </Comp>
      );
    };

  return {
    ...mdBase,
    h2: attach("h2", "pb-2 text-2xl font-bold tracking-tight text-text-base"),
    h3: attach("h3", "text-xl font-semibold tracking-tight text-text-base"),
    h4: attach("h4", "text-lg font-semibold text-text-base"),
    h5: attach("h5", "text-base font-semibold text-text-base"),
    h6: attach("h6", "text-sm font-semibold text-text-muted"),
  };
}

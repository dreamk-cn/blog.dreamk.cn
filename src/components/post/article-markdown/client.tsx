"use client";

import { useMemo } from "react";
import ReactMarkdown, { MarkdownHooks } from "react-markdown";
import { MarkdownImageLightboxProvider } from "@/components/markdown";
import {
  articleRemarkPlugins,
  articleRehypePlugins,
  articleRehypeSlugOnly,
  createArticleMarkdownComponents,
} from "./config";

/** Client-side preview (admin form). Async Shiki runs after mount; blog pages should use {@link ArticleMarkdown} instead. */
export function ArticleMarkdownClient({ content }: { content: string }) {
  const body = content || "暂无正文内容";
  const merged = useMemo(() => createArticleMarkdownComponents(), []);

  return (
    <MarkdownImageLightboxProvider>
      <div className="article-md">
        <MarkdownHooks
          remarkPlugins={articleRemarkPlugins}
          rehypePlugins={articleRehypePlugins}
          components={merged}
          fallback={
            <ReactMarkdown remarkPlugins={articleRemarkPlugins} rehypePlugins={articleRehypeSlugOnly} components={merged}>
              {body}
            </ReactMarkdown>
          }
        >
          {body}
        </MarkdownHooks>
      </div>
    </MarkdownImageLightboxProvider>
  );
}

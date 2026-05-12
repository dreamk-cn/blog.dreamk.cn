import { MarkdownAsync } from "react-markdown";
import {
  articleRemarkPlugins,
  articleRehypePlugins,
  createArticleMarkdownComponents,
} from "./config";

export async function ArticleMarkdown({ content }: { content: string }) {
  const body = content || "暂无正文内容";
  const merged = createArticleMarkdownComponents();

  return (
    <div className="article-md">
      {await MarkdownAsync({
        children: body,
        remarkPlugins: articleRemarkPlugins,
        rehypePlugins: articleRehypePlugins,
        components: merged,
      })}
    </div>
  );
}

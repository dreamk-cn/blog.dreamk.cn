import GithubSlugger from "github-slugger";

export type MarkdownTocItem = {
  level: number;
  id: string;
  text: string;
};

function stripCodeFences(md: string) {
  return md.replace(/```[\s\S]*?```/g, "\n");
}

export function slugifyHeading(text: string, slugger: GithubSlugger) {
  const normalized = text
    .trim()
    .replace(/\s+#+\s*$/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1");
  return slugger.slug(normalized || "section");
}

/** 从 Markdown 中提取 h2–h6 作为目录（跳过代码块内内容） */
export function extractMarkdownToc(md: string): MarkdownTocItem[] {
  const clean = stripCodeFences(md || "");
  const lines = clean.split("\n");
  const items: MarkdownTocItem[] = [];
  const slugger = new GithubSlugger();

  for (const line of lines) {
    const m = line.match(/^(#{2,6})\s+(.+)$/);
    if (!m) continue;
    const level = m[1].length;
    let text = m[2].trim().replace(/\s+#+\s*$/, "");
    text = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
    const id = slugifyHeading(text, slugger);
    items.push({ level, id, text });
  }

  return items;
}

/** 粗略字数：去掉常见 Markdown 标记后统计字符数 */
export function estimateArticleCharCount(md: string) {
  const plain = (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_\-`~]/g, " ")
    .replace(/\s+/g, "");

  return plain.length;
}

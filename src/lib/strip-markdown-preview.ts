const PREVIEW_MAX_LENGTH = 120;

/** 侧边栏等摘要场景：去掉常见 Markdown 语法，压缩空白 */
export function stripMarkdownPreview(text: string, maxLength = PREVIEW_MAX_LENGTH): string {
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength)}…`;
}

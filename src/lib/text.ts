type TruncateTextOptions = {
  ellipsis?: string;
};

/** 折叠空白后按长度截断文本 */
export function truncateText(text: string, maxLength: number, options?: TruncateTextOptions): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}${options?.ellipsis ?? ""}`;
}

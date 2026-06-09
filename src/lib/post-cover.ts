/** 本地占位图；无封面或无效输入时使用 */
export const POST_COVER_PLACEHOLDER_PATH = "/images/post-cover-placeholder.svg";

export type CoverMediaItem = {
  mediaFile: {
    url: string;
  };
};

/** next/image 可接受的 src：以 / 开头的站内路径，或 http(s) 绝对地址 */
export function isValidCoverSrc(value?: string | null): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getCoverUrls(coverMedia?: CoverMediaItem[] | null) {
  return (coverMedia ?? [])
    .map((item) => item.mediaFile.url?.trim())
    .filter((url): url is string => Boolean(url && isValidCoverSrc(url)));
}

export function getPrimaryCoverUrl(coverMedia?: CoverMediaItem[] | null) {
  return getCoverUrls(coverMedia)[0] ?? null;
}

export function resolvePostCoverSrc(coverUrl?: string | null) {
  const trimmed = coverUrl?.trim();
  if (trimmed && isValidCoverSrc(trimmed)) {
    return { src: trimmed, isPlaceholder: false as const };
  }
  return { src: POST_COVER_PLACEHOLDER_PATH, isPlaceholder: true as const };
}

export function isRemoteCoverSrc(src: string) {
  return /^https?:\/\//i.test(src);
}

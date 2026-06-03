/** 本地占位图；无 coverUrl 时使用，后续 OSS 地址走 coverUrl */
export const POST_COVER_PLACEHOLDER_PATH = "/images/post-cover-placeholder.svg";

export function resolvePostCoverSrc(coverUrl?: string | null) {
  const trimmed = coverUrl?.trim();
  if (trimmed) {
    return { src: trimmed, isPlaceholder: false as const };
  }
  return { src: POST_COVER_PLACEHOLDER_PATH, isPlaceholder: true as const };
}

export function isRemoteCoverSrc(src: string) {
  return /^https?:\/\//i.test(src);
}

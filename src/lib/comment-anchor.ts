/** 与邮件、站内 DOM 统一的评论锚点 id（不含 #） */
export function commentDomId(commentId: string) {
  return `comment-${commentId}`;
}

export function parseCommentTargetFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const fromHash = /^#comment-(.+)$/.exec(window.location.hash);
  if (fromHash?.[1]) {
    return decodeURIComponent(fromHash[1]);
  }
  const q = new URLSearchParams(window.location.search).get("comment");
  return q?.trim() || null;
}

/** 邮件与分享链接：绝对 URL + ?comment= + #comment-，兼容部分客户端丢 hash 的情况 */
export function postUrlWithCommentAnchor(basePostUrl: string, commentId: string) {
  try {
    const u = new URL(basePostUrl);
    u.searchParams.set("comment", commentId);
    u.hash = commentDomId(commentId);
    return u.toString();
  } catch {
    const hasQuery = basePostUrl.includes("?");
    return `${basePostUrl}${hasQuery ? "&" : "?"}comment=${encodeURIComponent(commentId)}#${commentDomId(commentId)}`;
  }
}

/** 深链失效时去掉 ?comment= 与 #comment-，避免地址栏长期保留无效锚点 */
export function clearCommentAnchorFromUrl() {
  if (typeof window === "undefined") return;
  const u = new URL(window.location.href);
  const hadQuery = u.searchParams.has("comment");
  const hadHash = u.hash.length > 0 && /^#comment-/.test(u.hash);
  if (!hadQuery && !hadHash) return;
  u.searchParams.delete("comment");
  if (hadHash) {
    u.hash = "";
  }
  window.history.replaceState(window.history.state, "", `${u.pathname}${u.search}${u.hash}`);
}

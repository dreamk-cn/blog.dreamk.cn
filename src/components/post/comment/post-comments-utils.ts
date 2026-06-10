import type { CommentItem, ServerCommentPayload } from "./post-comments-types";

export function getAvatarFallback(name?: string | null) {
  const normalized = name?.trim();
  if (!normalized) return "匿";
  return normalized.slice(0, 1).toUpperCase();
}

export function mapServerCommentToItem(comment: ServerCommentPayload): CommentItem {
  return {
    id: comment.id,
    content: comment.content,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    user: comment.user,
    replyTo: comment.replyTo,
    totalReplyCount: comment.totalReplyCount,
    replies: (comment.replies ?? []).map((reply) => ({
      id: reply.id,
      content: reply.content,
      parentId: reply.parentId,
      createdAt: reply.createdAt,
      user: reply.user,
      replyTo: reply.replyTo,
      replies: [],
    })),
  };
}

export function isDescendantInList(
  candidate: { parentId: string | null },
  rootId: string,
  map: Map<string, { parentId: string | null }>,
) {
  let cursor = candidate.parentId;
  while (cursor) {
    if (cursor === rootId) return true;
    const parent = map.get(cursor);
    if (!parent) return false;
    cursor = parent.parentId;
  }
  return false;
}

export function removeLoadedDescendantsFromReplies(replies: CommentItem[], rootId: string) {
  const map = new Map(replies.map((item) => [item.id, { parentId: item.parentId }]));
  return replies.filter((item) => item.id !== rootId && !isDescendantInList(item, rootId, map));
}

import type { ApiResponse } from "@/types/request";
import type { CommentItem, ServerCommentPayload } from "./post-comments-types";
import { mapServerCommentToItem } from "./post-comments-utils";

export const COMMENT_REPLY_FETCH_MAX = 500;
export const DEEP_LINK_ROOT_PREFIX_MAX = 30;

export async function fetchPublicRootComments(
  slug: string,
  options: { skip: number; take: number; replyTake: number },
) {
  const params = new URLSearchParams({
    slug,
    skip: String(options.skip),
    take: String(options.take),
    replyTake: String(options.replyTake),
  });
  const response = await fetch(`/api/post/comment?${params.toString()}`);
  return (await response.json()) as ApiResponse<{
    comments: ServerCommentPayload[];
    totalRootCount: number;
  }>;
}

export async function fetchPublicRootReplies(
  slug: string,
  rootId: string,
  options: { replySkip: number; replyTake: number },
) {
  const params = new URLSearchParams({
    slug,
    rootId,
    replySkip: String(options.replySkip),
    replyTake: String(options.replyTake),
  });
  const response = await fetch(`/api/post/comment?${params.toString()}`);
  return (await response.json()) as ApiResponse<{
    replies: ServerCommentPayload[];
    totalReplyCount: number;
  }>;
}

export function mapServerRepliesToItems(replies: ServerCommentPayload[]): CommentItem[] {
  return replies.map((reply) => mapServerCommentToItem({ ...reply, replies: reply.replies ?? [] }));
}

export function mergePrefixRootComments(prev: CommentItem[], incoming: CommentItem[]): CommentItem[] {
  const incomingIds = new Set(incoming.map((item) => item.id));
  const rest = prev.filter((item) => !incomingIds.has(item.id));
  return [...incoming, ...rest];
}

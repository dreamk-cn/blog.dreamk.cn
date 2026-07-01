"use client";

import type { ComponentProps } from "react";
import { Avatar, Button, Spinner, TextArea } from "@heroui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownImage, MarkdownImageLightboxProvider } from "@/components/markdown";
import { commentDomId } from "@/lib/comment-anchor";
import { formatDateTime } from "@/lib/format-datetime";
import type { CommentItem } from "./post-comments-types";
import { getAvatarFallback } from "./post-comments-utils";

type ReplyingState = {
  id: string;
  name: string;
  rootId: string;
};

const commentMarkdownComponents = {
  img: (props: ComponentProps<typeof MarkdownImage>) => <MarkdownImage variant="comment" {...props} />,
};

export function PostCommentItem({
  comment,
  threadRootId,
  isReply = false,
  flashCommentId,
  submitting,
  deletingCommentId,
  confirmDeleteId,
  loadingReplyRootId,
  sessionUserId,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onReplyPress,
  onCancelReply,
  onSubmitReply,
  onDeletePress,
  onLoadMoreReplies,
}: {
  comment: CommentItem;
  /** 顶层评论 id，整条线程内不变 */
  threadRootId: string;
  isReply?: boolean;
  flashCommentId: string | null;
  submitting: boolean;
  deletingCommentId: string | null;
  confirmDeleteId: string | null;
  loadingReplyRootId: string | null;
  sessionUserId?: string | null;
  replyingTo: ReplyingState | null;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  onReplyPress: (comment: CommentItem, threadRootId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: () => void;
  onDeletePress: (comment: CommentItem, threadRootId: string) => void;
  onLoadMoreReplies: (rootId: string) => void;
}) {
  const replyTotal = comment.totalReplyCount ?? comment.replies.length;
  const showReplyThread =
    !isReply && (comment.replies.length > 0 || replyTotal > 0);

  return (
    <article
      id={commentDomId(comment.id)}
      className={`scroll-mt-24 rounded-xl border border-default-200/70 bg-default-50/50 px-4 py-4 transition-[box-shadow,background-color] duration-500 dark:border-default-100/20 dark:bg-default-100/5 ${isReply ? "ml-6 mt-3" : ""} ${
        flashCommentId === comment.id
          ? "z-1 bg-primary/15 ring-2 ring-primary/75 ring-offset-2 ring-offset-content1 shadow-md dark:bg-primary/20 dark:ring-primary/60 dark:ring-offset-content1/80"
          : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar color="default" size="sm">
            {comment.user?.image ? <Avatar.Image src={comment.user.image} alt="" /> : null}
            <Avatar.Fallback>{getAvatarFallback(comment.user?.name)}</Avatar.Fallback>
          </Avatar>
          <span className="truncate font-medium text-text-base">
            {comment.user?.name?.trim() || "匿名访客"}
          </span>
        </div>
        <span className="shrink-0 text-text-muted">{formatDateTime(comment.createdAt)}</span>
      </div>

      <div className="prose prose-sm mt-2 max-w-none wrap-break-word prose-p:my-2 prose-pre:my-2 prose-code:text-xs dark:prose-invert">
        {isReply && comment.replyTo?.name ? (
          <p className="mb-2 text-xs text-primary">@{comment.replyTo.name}</p>
        ) : null}
        <MarkdownImageLightboxProvider>
          <div className="comment-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={commentMarkdownComponents}>
              {comment.content}
            </ReactMarkdown>
          </div>
        </MarkdownImageLightboxProvider>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          isDisabled={submitting || !!deletingCommentId}
          onPress={() => onReplyPress(comment, threadRootId)}
        >
          回复
        </Button>
        {sessionUserId && comment.user?.id === sessionUserId ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger"
            isDisabled={submitting || !!deletingCommentId}
            onPress={() => onDeletePress(comment, threadRootId)}
          >
            {deletingCommentId === comment.id ? <Spinner color="current" size="sm" /> : null}
            {deletingCommentId === comment.id
              ? "删除中..."
              : confirmDeleteId === comment.id
                ? "确认删除"
                : "删除"}
          </Button>
        ) : null}
      </div>

      {replyingTo?.id === comment.id ? (
        <div className="mt-3 space-y-2 rounded-lg border border-default-200/70 bg-background p-3 dark:border-default-100/20">
          <TextArea
            variant="secondary"
            className="w-full text-text-base"
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            rows={3}
            placeholder={`回复 ${replyingTo.name}...`}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onPress={onCancelReply}>
              取消
            </Button>
            <Button size="sm" variant="primary" isDisabled={submitting} onPress={onSubmitReply}>
              {submitting ? "提交中..." : "提交回复"}
            </Button>
          </div>
        </div>
      ) : null}

      {showReplyThread ? (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <PostCommentItem
              key={reply.id}
              comment={reply}
              threadRootId={threadRootId}
              isReply
              flashCommentId={flashCommentId}
              submitting={submitting}
              deletingCommentId={deletingCommentId}
              confirmDeleteId={confirmDeleteId}
              loadingReplyRootId={loadingReplyRootId}
              sessionUserId={sessionUserId}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={onReplyContentChange}
              onReplyPress={onReplyPress}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              onDeletePress={onDeletePress}
              onLoadMoreReplies={onLoadMoreReplies}
            />
          ))}
          {replyTotal > comment.replies.length ? (
            <div className="mt-3 flex justify-center">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={loadingReplyRootId === comment.id}
                onPress={() => onLoadMoreReplies(comment.id)}
              >
                {loadingReplyRootId === comment.id ? <Spinner color="current" size="sm" /> : null}
                {loadingReplyRootId === comment.id ? "加载中…" : "加载更多回复"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

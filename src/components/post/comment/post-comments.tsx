"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Spinner, TextArea, toast } from "@heroui/react";
import type { ApiResponse } from "@/types/request";
import { PostCommentItem } from "./post-comment-item";
import type { CommentItem } from "./post-comments-types";
import {
  COMMENT_REPLY_FETCH_MAX,
  DEEP_LINK_ROOT_PREFIX_MAX,
  fetchPublicRootComments,
  fetchPublicRootReplies,
  mapServerRepliesToItems,
  mergePrefixRootComments,
} from "./post-comments-api";
import {
  mapServerCommentToItem,
  removeLoadedDescendantsFromReplies,
} from "./post-comments-utils";
import { useCommentDeepLink } from "./use-comment-deep-link";

export function PostComments(props: {
  slug: string;
  initialComments: CommentItem[];
  rootPageSize: number;
  replyPageSize: number;
  initialTotalRootCount: number;
  totalApprovedCommentCount: number;
}) {
  return (
    <Suspense fallback={<PostCommentsFallback {...props} />}>
      <PostCommentsInner {...props} />
    </Suspense>
  );
}

function PostCommentsFallback({
  initialComments,
  totalApprovedCommentCount,
}: {
  slug: string;
  initialComments: CommentItem[];
  rootPageSize: number;
  replyPageSize: number;
  initialTotalRootCount: number;
  totalApprovedCommentCount: number;
}) {
  return (
    <section
      id="comments"
      className="mt-8 rounded-2xl border border-default-200/70 bg-background p-6 shadow-sm dark:border-default-100/20 sm:p-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-base">评论区</h2>
        <span className="text-sm text-text-muted">{totalApprovedCommentCount} 条评论</span>
      </div>
      <div className="mt-8 space-y-4">
        {initialComments.length === 0 ? (
          <p className="rounded-xl bg-default-100/70 px-4 py-6 text-center text-sm text-text-muted dark:bg-default-100/10">
            还没有评论，欢迎成为第一个留言的人。
          </p>
        ) : (
          initialComments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-default-200/70 bg-default-50/50 px-4 py-4 dark:border-default-100/20 dark:bg-default-100/5"
            >
              <p className="text-sm text-text-base">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PostCommentsInner({
  slug,
  initialComments,
  rootPageSize,
  replyPageSize,
  initialTotalRootCount,
  totalApprovedCommentCount,
}: {
  slug: string;
  initialComments: CommentItem[];
  rootPageSize: number;
  replyPageSize: number;
  initialTotalRootCount: number;
  totalApprovedCommentCount: number;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [totalRootCount, setTotalRootCount] = useState(initialTotalRootCount);
  const [approvedCommentTotal, setApprovedCommentTotal] = useState(totalApprovedCommentCount);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingReplyRootId, setLoadingReplyRootId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
    rootId: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const commentCountText = useMemo(() => `${approvedCommentTotal} 条评论`, [approvedCommentTotal]);
  const hasMoreRoots = comments.length < totalRootCount;

  const loadMoreComments = async () => {
    if (!hasMoreRoots || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchPublicRootComments(slug, {
        skip: comments.length,
        take: rootPageSize,
        replyTake: replyPageSize,
      });
      if (result.code !== 200) {
        toast.danger("加载失败", { description: result.message || "请稍后再试" });
        return;
      }
      setTotalRootCount(result.data.totalRootCount);
      const mapped = result.data.comments.map(mapServerCommentToItem);
      setComments((prev) => [...prev, ...mapped]);
    } catch {
      toast.danger("加载失败", { description: "网络异常，请稍后重试" });
    } finally {
      setLoadingMore(false);
    }
  };

  const loadRootAtIndex = async (rootIndex: number) => {
    if (loadingMore || loadingReplyRootId) return;
    setLoadingMore(true);
    try {
      if (rootIndex <= DEEP_LINK_ROOT_PREFIX_MAX) {
        const result = await fetchPublicRootComments(slug, {
          skip: 0,
          take: rootIndex + 1,
          replyTake: replyPageSize,
        });
        if (result.code !== 200) {
          toast.danger("加载失败", { description: result.message || "请稍后再试" });
          return;
        }
        const mapped = result.data.comments.map(mapServerCommentToItem);
        if (mapped.length === 0) return;

        setTotalRootCount(result.data.totalRootCount);
        setComments((prev) => mergePrefixRootComments(prev, mapped));
        return;
      }

      toast.info("该评论楼层较深", {
        description: "列表可能不完整，但会尽量定位到链接中的评论。",
      });

      const result = await fetchPublicRootComments(slug, {
        skip: rootIndex,
        take: 1,
        replyTake: replyPageSize,
      });
      if (result.code !== 200) {
        toast.danger("加载失败", { description: result.message || "请稍后再试" });
        return;
      }
      const mapped = result.data.comments.map(mapServerCommentToItem);
      if (mapped.length === 0) return;

      setTotalRootCount(result.data.totalRootCount);
      setComments((prev) => {
        const rootId = mapped[0]?.id;
        if (!rootId || prev.some((item) => item.id === rootId)) {
          return prev;
        }
        const next = [...prev];
        next.splice(Math.min(rootIndex, next.length), 0, ...mapped);
        return next;
      });
    } catch {
      toast.danger("加载失败", { description: "网络异常，请稍后重试" });
    } finally {
      setLoadingMore(false);
    }
  };

  const loadRepliesUpToIndex = async (rootId: string, replyFlatIndex: number) => {
    const root = comments.find((item) => item.id === rootId);
    if (!root || loadingReplyRootId) return;
    const take = Math.min(replyFlatIndex + 1, COMMENT_REPLY_FETCH_MAX);
    if (root.replies.length >= take) return;

    setLoadingReplyRootId(rootId);
    try {
      const result = await fetchPublicRootReplies(slug, rootId, { replySkip: 0, replyTake: take });
      if (result.code !== 200) {
        toast.danger("加载失败", { description: result.message || "请稍后再试" });
        return;
      }
      const mapped = mapServerRepliesToItems(result.data.replies);
      setComments((prev) =>
        prev.map((item) =>
          item.id === rootId
            ? {
                ...item,
                replies: mapped,
                totalReplyCount: result.data.totalReplyCount,
              }
            : item,
        ),
      );
    } catch {
      toast.danger("加载失败", { description: "网络异常，请稍后重试" });
    } finally {
      setLoadingReplyRootId(null);
    }
  };

  const loadMoreRepliesForRoot = async (rootId: string) => {
    const root = comments.find((c) => c.id === rootId);
    const replyCap = root ? (root.totalReplyCount ?? root.replies.length) : 0;
    if (!root || replyCap <= root.replies.length || loadingReplyRootId) return;
    setLoadingReplyRootId(rootId);
    try {
      const result = await fetchPublicRootReplies(slug, rootId, {
        replySkip: root.replies.length,
        replyTake: replyPageSize,
      });
      if (result.code !== 200) {
        toast.danger("加载失败", { description: result.message || "请稍后再试" });
        return;
      }
      const mapped = mapServerRepliesToItems(result.data.replies);
      setComments((prev) =>
        prev.map((c) =>
          c.id === rootId
            ? {
                ...c,
                replies: [...c.replies, ...mapped],
                totalReplyCount: result.data.totalReplyCount,
              }
            : c,
        ),
      );
    } catch {
      toast.danger("加载失败", { description: "网络异常，请稍后重试" });
    } finally {
      setLoadingReplyRootId(null);
    }
  };

  const { flashCommentId, deepLinkLoading } = useCommentDeepLink({
    slug,
    comments,
    loadingMore,
    loadingReplyRootId,
    loadMoreRepliesForRoot,
    loadRootAtIndex,
    loadRepliesUpToIndex,
  });

  const createDisplayComment = (comment: CommentItem): CommentItem => ({
    ...comment,
    replies: comment.replies || [],
    replyTo: comment.replyTo || null,
    totalReplyCount: comment.parentId != null ? undefined : (comment.totalReplyCount ?? 0),
    user: comment.user || {
      id: "anonymous",
      name: session?.user?.name || "匿名访客",
      image: session?.user?.image || null,
    },
  });

  const handleDeleteComment = async (comment: CommentItem, rootId: string) => {
    if (deletingCommentId) return;
    setDeletingCommentId(comment.id);
    try {
      const response = await fetch("/api/post/comment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          id: comment.id,
        }),
      });
      const result = (await response.json()) as ApiResponse<{
        deletedIds: string[];
        deletedApprovedCount: number;
        deletedRootCount: number;
      }>;
      if (result.code !== 200) {
        toast.danger("删除失败", { description: result.message || "请稍后再试" });
        return;
      }

      if (comment.parentId === null) {
        setComments((prev) => prev.filter((item) => item.id !== comment.id));
      } else {
        setComments((prev) =>
          prev.map((item) => {
            if (item.id !== rootId) return item;
            const nextReplies = removeLoadedDescendantsFromReplies(item.replies, comment.id);
            const oldTotal = item.totalReplyCount ?? item.replies.length;
            const nextTotal = Math.max(nextReplies.length, oldTotal - result.data.deletedApprovedCount);
            return {
              ...item,
              replies: nextReplies,
              totalReplyCount: nextTotal,
            };
          }),
        );
      }
      setApprovedCommentTotal((n) => Math.max(0, n - result.data.deletedApprovedCount));
      setTotalRootCount((n) => Math.max(0, n - result.data.deletedRootCount));
      if (replyingTo && (replyingTo.id === comment.id || replyingTo.rootId === comment.id)) {
        setReplyingTo(null);
        setReplyContent("");
      }
      toast.success("评论删除成功");
    } catch {
      toast.danger("删除失败", { description: "网络异常，请稍后重试" });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const requestDeleteWithConfirm = (comment: CommentItem, rootId: string) => {
    if (confirmDeleteId === comment.id) {
      if (confirmDeleteTimer.current) {
        clearTimeout(confirmDeleteTimer.current);
        confirmDeleteTimer.current = null;
      }
      setConfirmDeleteId(null);
      void handleDeleteComment(comment, rootId);
      return;
    }

    if (confirmDeleteTimer.current) {
      clearTimeout(confirmDeleteTimer.current);
    }
    setConfirmDeleteId(comment.id);
    toast.warning("再次点击删除以确认", {
      description: "3 秒内再次点击“删除”将执行删除操作",
    });
    confirmDeleteTimer.current = setTimeout(() => {
      setConfirmDeleteId((prev) => (prev === comment.id ? null : prev));
      confirmDeleteTimer.current = null;
    }, 3000);
  };

  const submitComment = async (text: string, parentId?: string) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/post/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          content: text,
          parentId,
        }),
      });
      const result = (await response.json()) as ApiResponse<{ comment: CommentItem; status: "APPROVED" | "PENDING" }>;
      if (result.code !== 200) {
        toast.danger("留言失败", { description: result.message || "请稍后再试" });
        return false;
      }

      if (result.data.status === "APPROVED") {
        const incoming = createDisplayComment(result.data.comment as CommentItem);
        setApprovedCommentTotal((n) => n + 1);
        if (parentId && replyingTo) {
          const rootId = replyingTo.rootId;
          const rootSnapshot = comments.find((c) => c.id === rootId);
          const replyCap =
            rootSnapshot == null ? 0 : (rootSnapshot.totalReplyCount ?? rootSnapshot.replies.length);
          const emptyThread = rootSnapshot != null && replyCap === 0;
          const hadAllReplies =
            rootSnapshot != null && replyCap > 0 && rootSnapshot.replies.length >= replyCap;

          if (hadAllReplies || emptyThread) {
            setComments((prev) =>
              prev.map((item) =>
                item.id === rootId
                  ? {
                      ...item,
                      replies: [
                        ...item.replies,
                        {
                          ...incoming,
                          replyTo: {
                            id: replyingTo.id,
                            name: replyingTo.name,
                            image: null,
                          },
                          replies: [],
                        },
                      ],
                      totalReplyCount: (item.totalReplyCount ?? item.replies.length) + 1,
                    }
                  : item,
              ),
            );
          } else {
            const newTotal = replyCap + 1;
            const refetch = await fetchPublicRootReplies(slug, rootId, {
              replySkip: 0,
              replyTake: Math.min(newTotal, COMMENT_REPLY_FETCH_MAX),
            });
            if (refetch.code !== 200) {
              toast.danger("留言失败", { description: refetch.message || "请稍后再试" });
              return false;
            }
            const mapped = mapServerRepliesToItems(refetch.data.replies);
            setComments((prev) =>
              prev.map((item) =>
                item.id === rootId
                  ? { ...item, replies: mapped, totalReplyCount: refetch.data.totalReplyCount }
                  : item,
              ),
            );
          }
          toast.success("回复发布成功");
        } else {
          setComments((prev) => [incoming, ...prev]);
          setTotalRootCount((n) => n + 1);
          toast.success("评论发布成功");
        }
      } else if (parentId) {
        toast.success("回复已提交，等待审核");
      } else {
        toast.success("留言已提交，等待审核");
      }
      return true;
    } catch {
      toast.danger("留言失败", { description: "网络异常，请稍后重试" });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (text.length < 2) {
      toast.warning("请至少输入2个字符");
      return;
    }
    if (text.length > 2000) {
      toast.warning("评论内容不能超过2000字符");
      return;
    }
    const success = await submitComment(text);
    if (success) {
      setContent("");
    }
  };

  const handleReplySubmit = async () => {
    if (!replyingTo) return;
    const text = replyContent.trim();
    if (text.length < 2) {
      toast.warning("请至少输入2个字符");
      return;
    }
    if (text.length > 2000) {
      toast.warning("回复内容不能超过2000字符");
      return;
    }
    const success = await submitComment(text, replyingTo.id);
    if (success) {
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  return (
    <section
      id="comments"
      className="mt-8 rounded-2xl border border-default-200/70 bg-background p-6 shadow-sm dark:border-default-100/20 sm:p-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-base">评论区</h2>
        <span className="text-sm text-text-muted">{commentCountText}</span>
      </div>

      <div className="space-y-3">
        <TextArea
          variant="secondary"
          className="w-full text-text-base"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          disabled={submitting}
          placeholder={session?.user ? "说点什么吧..." : "欢迎留言（未登录留言需要审核）"}
        />
        <div className="flex justify-end">
          <Button variant="primary" onPress={handleSubmit} isDisabled={submitting}>
            {submitting ? <Spinner color="current" size="sm" /> : null}
            {submitting ? "提交中..." : "提交留言"}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {deepLinkLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-default-100/70 px-4 py-3 text-sm text-text-muted dark:bg-default-100/10">
            <Spinner color="current" size="sm" />
            正在定位评论…
          </div>
        ) : null}
        {comments.length === 0 ? (
          <p className="rounded-xl bg-default-100/70 px-4 py-6 text-center text-sm text-text-muted dark:bg-default-100/10">
            还没有评论，欢迎成为第一个留言的人。
          </p>
        ) : (
          comments.map((comment) => (
            <PostCommentItem
              key={comment.id}
              comment={comment}
              threadRootId={comment.id}
              flashCommentId={flashCommentId}
              submitting={submitting}
              deletingCommentId={deletingCommentId}
              confirmDeleteId={confirmDeleteId}
              loadingReplyRootId={loadingReplyRootId}
              sessionUserId={session?.user?.id}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onReplyPress={(c, threadRootId) => {
                setReplyingTo({
                  id: c.id,
                  name: c.user?.name?.trim() || "匿名访客",
                  rootId: threadRootId,
                });
                setReplyContent("");
              }}
              onCancelReply={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
              onSubmitReply={handleReplySubmit}
              onDeletePress={(c, threadRootId) => requestDeleteWithConfirm(c, threadRootId)}
              onLoadMoreReplies={loadMoreRepliesForRoot}
            />
          ))
        )}
        {hasMoreRoots ? (
          <div className="flex justify-center pt-2">
            <Button variant="outline" isDisabled={loadingMore} onPress={loadMoreComments}>
              {loadingMore ? <Spinner color="current" size="sm" /> : null}
              {loadingMore ? "加载中…" : "加载更多"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

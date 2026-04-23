"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, Button, Spinner, TextArea, toast } from "@heroui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CommentItem = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  replyTo: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  replies: CommentItem[];
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getAvatarFallback(name?: string | null) {
  const normalized = name?.trim();
  if (!normalized) return "匿";
  return normalized.slice(0, 1).toUpperCase();
}

type ServerCommentPayload = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentItem["user"];
  replyTo: CommentItem["replyTo"];
  replies: ServerCommentPayload[];
};

function mapServerCommentToItem(comment: ServerCommentPayload): CommentItem {
  return {
    id: comment.id,
    content: comment.content,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    user: comment.user,
    replyTo: comment.replyTo,
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

export function PostComments({
  slug,
  initialComments,
  rootPageSize,
  initialTotalRootCount,
  totalApprovedCommentCount,
}: {
  slug: string;
  initialComments: CommentItem[];
  rootPageSize: number;
  initialTotalRootCount: number;
  totalApprovedCommentCount: number;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [totalRootCount, setTotalRootCount] = useState(initialTotalRootCount);
  const [approvedCommentTotal, setApprovedCommentTotal] = useState(totalApprovedCommentCount);
  const [loadingMore, setLoadingMore] = useState(false);
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
      const skip = comments.length;
      const params = new URLSearchParams({
        slug,
        skip: String(skip),
        take: String(rootPageSize),
      });
      const response = await fetch(`/api/post/comment?${params.toString()}`);
      const result = (await response.json()) as ApiResponse<{
        comments: ServerCommentPayload[];
        totalRootCount: number;
      }>;
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

  const createDisplayComment = (comment: CommentItem): CommentItem => ({
    ...comment,
    replies: comment.replies || [],
    replyTo: comment.replyTo || null,
    user: comment.user || {
      id: "anonymous",
      name: session?.user?.name || "匿名访客",
      image: session?.user?.image || null,
    },
  });

  const findComment = (id: string) => {
    for (const item of comments) {
      if (item.id === id) return { comment: item, rootId: item.id };
      const reply = item.replies.find((r) => r.id === id);
      if (reply) return { comment: reply, rootId: item.id };
    }
    return null;
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
        const incoming = createDisplayComment(result.data.comment);
        setApprovedCommentTotal((n) => n + 1);
        if (parentId && replyingTo) {
          setComments((prev) =>
            prev.map((item) =>
              item.id === replyingTo.rootId
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
                      },
                    ],
                  }
                : item,
            ),
          );
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

  const renderComment = (comment: CommentItem, isReply = false) => (
    <article
      key={comment.id}
      className={`rounded-xl border border-default-200/70 bg-default-50/50 px-4 py-4 dark:border-default-100/20 dark:bg-default-100/5 ${isReply ? "ml-6 mt-3" : ""}`}
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

      <div className="prose prose-sm mt-2 max-w-none break-words prose-p:my-2 prose-pre:my-2 prose-code:text-xs dark:prose-invert">
        {isReply && comment.replyTo?.name ? (
          <p className="mb-2 text-xs text-primary">
            @{comment.replyTo.name}
          </p>
        ) : null}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          onPress={() => {
            const found = findComment(comment.id);
            if (!found) return;
            setReplyingTo({
              id: found.comment.id,
              name: found.comment.user?.name?.trim() || "匿名访客",
              rootId: found.rootId,
            });
            setReplyContent("");
          }}
        >
          回复
        </Button>
      </div>

      {replyingTo?.id === comment.id ? (
        <div className="mt-3 space-y-2 rounded-lg border border-default-200/70 bg-content1 p-3 dark:border-default-100/20 dark:bg-content1/60">
          <TextArea
            className="w-full"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            placeholder={`回复 ${replyingTo.name}...`}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
            >
              取消
            </Button>
            <Button size="sm" variant="primary" isDisabled={submitting} onPress={handleReplySubmit}>
              {submitting ? "提交中..." : "提交回复"}
            </Button>
          </div>
        </div>
      ) : null}

      {!isReply && comment.replies.length > 0 ? (
        <div className="mt-2">{comment.replies.map((reply) => renderComment(reply, true))}</div>
      ) : null}
    </article>
  );

  return (
    <section className="mt-8 rounded-2xl border border-default-200/70 bg-content1 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:border-default-100/20 dark:bg-content1/60 dark:shadow-none sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-base">评论区</h2>
        <span className="text-sm text-text-muted">{commentCountText}</span>
      </div>

      <div className="space-y-3">
        <TextArea
          className="w-full"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          disabled={submitting}
          placeholder={session?.user ? "说点什么吧..." : "欢迎留言（未登录留言需要审核）"}
        />
        <div className="flex justify-end">
          <Button variant="primary" onPress={handleSubmit} isDisabled={submitting}>
            {submitting ? <Spinner color="current" size="sm" /> : null }
            {submitting ? "提交中..." : "提交留言"}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <p className="rounded-xl bg-default-100/70 px-4 py-6 text-center text-sm text-text-muted dark:bg-default-100/10">
            还没有评论，欢迎成为第一个留言的人。
          </p>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
        {hasMoreRoots ? (
          <div className="flex justify-center pt-2">
            <Button variant="outline" isDisabled={loadingMore} onPress={loadMoreComments}>
              {loadingMore ? "加载中…" : "加载更多"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

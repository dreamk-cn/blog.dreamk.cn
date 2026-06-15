"use client";

/* Deep-link：hash / fetch / 分页补齐 / Toast 清理等需在 effect 内同步 React 状态 */
/* eslint-disable react-hooks/set-state-in-effect -- intentional URL ↔ state sync */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@heroui/react";
import type { ApiResponse } from "@/types/request";
import {
  clearCommentAnchorFromUrl,
  commentDomId,
  parseCommentTargetFromLocation,
} from "@/lib/comment-anchor";
import { COMMENT_REPLY_FETCH_MAX } from "./post-comments-api";
import type { CommentAnchorMeta, CommentItem } from "./post-comments-types";

type Options = {
  slug: string;
  comments: CommentItem[];
  loadingMore: boolean;
  loadingReplyRootId: string | null;
  loadMoreRepliesForRoot: (rootId: string) => void | Promise<void>;
  loadRootAtIndex: (rootIndex: number) => void | Promise<void>;
  loadRepliesUpToIndex: (rootId: string, replyFlatIndex: number) => void | Promise<void>;
};

/** 邮件 / 分享深链：解析 hash、拉锚点元数据、分页补齐、滚动高亮、失效提示 */
export function useCommentDeepLink({
  slug,
  comments,
  loadingMore,
  loadingReplyRootId,
  loadMoreRepliesForRoot,
  loadRootAtIndex,
  loadRepliesUpToIndex,
}: Options) {
  const searchParams = useSearchParams();
  const [mailCommentTarget, setMailCommentTarget] = useState<string | null>(null);
  const [mailAnchorMeta, setMailAnchorMeta] = useState<CommentAnchorMeta | null>(null);
  const [mailAnchorLoading, setMailAnchorLoading] = useState(false);
  const [flashCommentId, setFlashCommentId] = useState<string | null>(null);
  const [anchorFetchFailed, setAnchorFetchFailed] = useState(false);

  const mailScrollDoneRef = useRef<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorOrphanHandledRef = useRef<string | null>(null);
  const rootJumpLoadDoneRef = useRef<string | null>(null);
  const replyJumpLoadDoneRef = useRef<string | null>(null);
  const loadRepliesRef = useRef(loadMoreRepliesForRoot);
  const loadRootAtIndexRef = useRef(loadRootAtIndex);
  const loadRepliesUpToIndexRef = useRef(loadRepliesUpToIndex);

  useEffect(() => {
    loadRepliesRef.current = loadMoreRepliesForRoot;
    loadRootAtIndexRef.current = loadRootAtIndex;
    loadRepliesUpToIndexRef.current = loadRepliesUpToIndex;
  }, [loadMoreRepliesForRoot, loadRootAtIndex, loadRepliesUpToIndex]);

  useEffect(() => {
    mailScrollDoneRef.current = null;
    anchorOrphanHandledRef.current = null;
    rootJumpLoadDoneRef.current = null;
    replyJumpLoadDoneRef.current = null;
    setMailCommentTarget(parseCommentTargetFromLocation(searchParams));
    const onHash = () => {
      mailScrollDoneRef.current = null;
      setMailCommentTarget(parseCommentTargetFromLocation(searchParams));
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, [slug, searchParams]);

  useEffect(() => {
    if (!mailCommentTarget) {
      setMailAnchorMeta(null);
      setMailAnchorLoading(false);
      setAnchorFetchFailed(false);
      return;
    }
    let cancelled = false;
    setMailAnchorMeta(null);
    setMailAnchorLoading(true);
    setAnchorFetchFailed(false);
    void (async () => {
      try {
        const res = await fetch(
          `/api/post/comment/anchor?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(mailCommentTarget)}`,
        );
        const result = (await res.json()) as ApiResponse<CommentAnchorMeta>;
        if (cancelled) return;
        if (result.code === 200 && result.data) {
          setMailAnchorMeta(result.data);
          setAnchorFetchFailed(false);
        } else {
          setMailAnchorMeta(null);
          setAnchorFetchFailed(true);
        }
      } catch {
        if (!cancelled) {
          setMailAnchorMeta(null);
          setAnchorFetchFailed(true);
        }
      } finally {
        if (!cancelled) setMailAnchorLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, mailCommentTarget]);

  useEffect(() => {
    if (!mailCommentTarget || mailAnchorLoading) return;
    if (mailAnchorMeta) return;
    if (!anchorFetchFailed) return;

    toast.warning("链接中的评论已不存在、已删除或未公开展示", {
      description: "文章仍可正常阅读。隔日从邮件打开时，评论可能已被处理。",
    });
    clearCommentAnchorFromUrl();
    setMailCommentTarget(null);
    setAnchorFetchFailed(false);
    mailScrollDoneRef.current = null;
  }, [mailCommentTarget, mailAnchorLoading, mailAnchorMeta, anchorFetchFailed]);

  useEffect(() => {
    if (!mailCommentTarget || mailAnchorLoading || !mailAnchorMeta) return;
    if (document.getElementById(commentDomId(mailCommentTarget))) {
      anchorOrphanHandledRef.current = null;
      return;
    }
    if (loadingMore) return;
    if (loadingReplyRootId === mailAnchorMeta.rootId) return;

    const root = comments.find((c) => c.id === mailAnchorMeta.rootId);
    if (!root) {
      if (rootJumpLoadDoneRef.current !== mailCommentTarget) return;
    } else if (!mailAnchorMeta.isTargetRoot) {
      const inReplies = root.replies.some((r) => r.id === mailCommentTarget);
      if (inReplies) return;
      const expectedTake = Math.min((mailAnchorMeta.replyFlatIndex ?? 0) + 1, COMMENT_REPLY_FETCH_MAX);
      if (root.replies.length < expectedTake && root.replies.length < mailAnchorMeta.totalReplyCount) {
        if (replyJumpLoadDoneRef.current !== mailCommentTarget) return;
      }
    }

    if (anchorOrphanHandledRef.current === mailCommentTarget) return;
    anchorOrphanHandledRef.current = mailCommentTarget;

    toast.warning("未能定位到链接中的评论", {
      description: "可能已被删除或与列表不一致，已在地址栏清除锚点。",
    });
    clearCommentAnchorFromUrl();
    setMailCommentTarget(null);
    setMailAnchorMeta(null);
    setAnchorFetchFailed(false);
    mailScrollDoneRef.current = null;
  }, [
    mailCommentTarget,
    mailAnchorLoading,
    mailAnchorMeta,
    comments,
    loadingMore,
    loadingReplyRootId,
  ]);

  const applyCommentHighlight = (id: string) => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    setFlashCommentId(id);
    flashTimerRef.current = setTimeout(() => {
      setFlashCommentId(null);
      flashTimerRef.current = null;
    }, 4200);
  };

  useLayoutEffect(() => {
    if (!mailCommentTarget) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(commentDomId(mailCommentTarget));
      if (!el) return;
      if (mailScrollDoneRef.current === mailCommentTarget) return;

      mailScrollDoneRef.current = mailCommentTarget;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      applyCommentHighlight(mailCommentTarget);
    };

    tryScroll();
    requestAnimationFrame(tryScroll);
    for (const delay of [100, 300, 600, 1000]) {
      timers.push(setTimeout(tryScroll, delay));
    }

    return () => {
      cancelled = true;
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [mailCommentTarget, comments, slug]);

  useEffect(() => {
    if (!mailCommentTarget || mailAnchorLoading) return;
    if (document.getElementById(commentDomId(mailCommentTarget))) return;
    if (!mailAnchorMeta) return;

    const root = comments.find((c) => c.id === mailAnchorMeta.rootId);
    if (!root) {
      if (loadingMore) return;
      if (rootJumpLoadDoneRef.current === mailCommentTarget) return;
      rootJumpLoadDoneRef.current = mailCommentTarget;
      void loadRootAtIndexRef.current(mailAnchorMeta.rootIndex);
      return;
    }

    if (mailAnchorMeta.isTargetRoot) {
      return;
    }

    const inReplies = root.replies.some((r) => r.id === mailCommentTarget);
    if (inReplies) return;
    if (loadingReplyRootId === mailAnchorMeta.rootId) return;

    const replyFlatIndex = mailAnchorMeta.replyFlatIndex;
    if (replyFlatIndex != null) {
      if (replyJumpLoadDoneRef.current === mailCommentTarget) return;
      replyJumpLoadDoneRef.current = mailCommentTarget;
      void loadRepliesUpToIndexRef.current(mailAnchorMeta.rootId, replyFlatIndex);
      return;
    }

    const cap = mailAnchorMeta.totalReplyCount;
    if (root.replies.length < cap) {
      void loadRepliesRef.current(mailAnchorMeta.rootId);
    }
  }, [
    mailCommentTarget,
    mailAnchorLoading,
    mailAnchorMeta,
    comments,
    loadingMore,
    loadingReplyRootId,
    slug,
  ]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const deepLinkLoading = useMemo(() => {
    if (!mailCommentTarget || anchorFetchFailed) return false;
    if (mailAnchorLoading) return true;
    if (typeof document !== "undefined" && document.getElementById(commentDomId(mailCommentTarget))) {
      return false;
    }
    if (!mailAnchorMeta) return true;
    return loadingMore || loadingReplyRootId === mailAnchorMeta.rootId;
  }, [
    mailCommentTarget,
    mailAnchorLoading,
    anchorFetchFailed,
    mailAnchorMeta,
    loadingMore,
    loadingReplyRootId,
    comments,
  ]);

  return { flashCommentId, deepLinkLoading };
}

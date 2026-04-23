"use client";

import { StringSelect } from "@/components/admin/string-select";
import { request } from "@/libs/request";
import type { Comment, Post, User } from "@prisma/client";
import { Alert, Button, Chip, Input, Label, Pagination, Table, TextField } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

type CommentStatus = "PENDING" | "APPROVED" | "SPAM" | "DELETED";
type SortOrder = "asc" | "desc";

type CommentItem = Comment & {
  post: Pick<Post, "id" | "title" | "slug">;
  user: Pick<User, "id" | "name" | "email" | "image"> | null;
};

type ListResponse = {
  list: CommentItem[];
  total: number;
};

const statusMap: Record<CommentStatus, { label: string; color: "warning" | "success" | "danger" | "default" }> = {
  PENDING: { label: "待审核", color: "warning" },
  APPROVED: { label: "已通过", color: "success" },
  SPAM: { label: "垃圾评论", color: "danger" },
  DELETED: { label: "已删除", color: "default" },
};

function shortText(text: string, length = 80) {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

export default function AdminCommentListPage() {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<CommentStatus | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const keywordDebounced = useDebounce(keyword, 300);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.get<ListResponse>("/comments", {
        pageNo,
        pageSize,
        keyword: keywordDebounced || undefined,
        sortOrder,
        status: status === "all" ? undefined : status,
      });
      if (res.code === 200) {
        setItems(res.data?.list || []);
        setTotal(res.data?.total || 0);
      } else {
        setError(res.message || "获取评论列表失败");
      }
    } catch (err) {
      console.error("获取评论列表失败:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchComments();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo, pageSize, keywordDebounced, sortOrder, status]);

  const handleUpdateStatus = async (id: string, nextStatus: CommentStatus) => {
    setUpdatingId(id);
    try {
      const res = await request.put(
        "/comments",
        { id, status: nextStatus },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        fetchComments();
      }
    } catch (err) {
      console.error("更新评论状态失败:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await request.request({
        method: "DELETE",
        url: "/comments",
        data: { ids: [id] },
        showSuccessMessage: true,
      });
      if (res.code === 200) {
        const isLastItemOnPage = items.length === 1 && pageNo > 1;
        if (isLastItemOnPage) {
          setPageNo(pageNo - 1);
        } else {
          fetchComments();
        }
      }
    } catch (err) {
      console.error("删除评论失败:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return (
    <div className="space-y-4 p-4 text-text-base bg-foreground h-full">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-text-base">评论管理</h1>
        <div className="flex flex-wrap items-end gap-3">
          <TextField className="w-full sm:max-w-[30%]">
            <Label className="text-text-muted">关键词</Label>
            <Input
              placeholder="按评论、文章、用户搜索"
              value={keyword}
              onChange={(e) => {
                setPageNo(1);
                setKeyword(e.target.value);
              }}
            />
          </TextField>

          <StringSelect
            className="w-40"
            label="状态"
            selectedId={status}
            onSelectionChange={(id) => {
              setPageNo(1);
              setStatus(id as CommentStatus | "all");
            }}
            options={[
              { id: "all", label: "全部" },
              { id: "PENDING", label: "待审核" },
              { id: "APPROVED", label: "已通过" },
              { id: "SPAM", label: "垃圾评论" },
              { id: "DELETED", label: "已删除" },
            ]}
          />

          <StringSelect
            className="w-28"
            label="排序"
            selectedId={sortOrder}
            onSelectionChange={(id) => {
              setPageNo(1);
              setSortOrder(id as SortOrder);
            }}
            options={[
              { id: "desc", label: "倒序" },
              { id: "asc", label: "正序" },
            ]}
          />
        </div>
      </div>

      <div className="rounded-lg">
        <Table>
          <Table.ScrollContainer className="max-h-[calc(100vh-280px)]">
            <Table.Content aria-label="评论列表">
              <Table.Header>
                <Table.Column isRowHeader>评论</Table.Column>
                <Table.Column>文章</Table.Column>
                <Table.Column>用户</Table.Column>
                <Table.Column>状态</Table.Column>
                <Table.Column>创建时间</Table.Column>
                <Table.Column className="text-center">操作</Table.Column>
              </Table.Header>
              <Table.Body>
                {loading ? (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <span className="text-text-muted">加载中...</span>
                    </Table.Cell>
                  </Table.Row>
                ) : items.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <span className="text-text-muted">暂无数据</span>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  items.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        <div className="max-w-[360px]">
                          <p className="line-clamp-3 break-all text-sm text-text-base">{shortText(item.content, 120)}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex max-w-[260px] flex-col">
                          <span className="line-clamp-1 font-medium text-text-base">{item.post?.title || "-"}</span>
                          <span className="line-clamp-1 text-xs text-text-muted">{item.post?.slug || "-"}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex max-w-[220px] flex-col">
                          <span className="line-clamp-1 text-primary">{item.user?.name || "匿名访客"}</span>
                          <span className="line-clamp-1 text-xs text-text-muted">
                            {item.user?.email || item.userIp || "-"}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip size="sm" variant="soft" color={statusMap[item.status].color}>
                          <Chip.Label>{statusMap[item.status].label}</Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-xs text-text-muted">{new Date(item.createdAt).toLocaleString()}</Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap justify-center gap-2">
                          {item.status !== "APPROVED" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              isPending={updatingId === item.id}
                              onPress={() => handleUpdateStatus(item.id, "APPROVED")}
                            >
                              通过
                            </Button>
                          ) : null}
                          {item.status !== "SPAM" ? (
                            <Button
                              size="sm"
                              variant="danger-soft"
                              isPending={updatingId === item.id}
                              onPress={() => handleUpdateStatus(item.id, "SPAM")}
                            >
                              垃圾
                            </Button>
                          ) : null}
                          {item.status !== "PENDING" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              isPending={updatingId === item.id}
                              onPress={() => handleUpdateStatus(item.id, "PENDING")}
                            >
                              待审
                            </Button>
                          ) : null}
                          {item.status !== "DELETED" ? (
                            <Button
                              size="sm"
                              variant="danger"
                              isPending={deletingId === item.id}
                              onPress={() => handleDelete(item.id)}
                            >
                              删除
                            </Button>
                          ) : null}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-sm shrink-0">共 {total} 条数据</span>
          <StringSelect
            aria-label="每页条数"
            className="w-32"
            selectedId={String(pageSize)}
            onSelectionChange={(id) => {
              setPageNo(1);
              setPageSize(Number(id));
            }}
            options={[
              { id: "10", label: "10条/页" },
              { id: "20", label: "20条/页" },
              { id: "50", label: "50条/页" },
            ]}
          />
        </div>
        <Pagination>
          <Pagination.Content className="gap-1">
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={pageNo <= 1}
                onPress={() => setPageNo((p) => Math.max(1, p - 1))}
              >
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <span className="px-2 text-small text-text-muted">
                {pageNo} / {totalPages}
              </span>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next
                isDisabled={pageNo >= totalPages}
                onPress={() => setPageNo((p) => Math.min(totalPages, p + 1))}
              >
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Title>错误</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      ) : null}
    </div>
  );
}

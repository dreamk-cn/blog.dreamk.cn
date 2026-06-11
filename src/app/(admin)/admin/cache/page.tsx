"use client";

import { ANON_COMMENT_RATE_CACHE_KEY_PREFIX } from "@/lib/cache/cache-key-prefixes";
import { StringSelect } from "@/components/admin/string-select";
import { request } from "@/lib/request";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Alert,
  Button,
  Input,
  Label,
  Modal,
  Pagination,
  Spinner,
  Table,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AppCacheRow = {
  key: string;
  value: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  list: AppCacheRow[];
  total: number;
};

function shortText(text: string, length = 64) {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}

function formatDt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function AdminAppCachePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<AppCacheRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState<"expired" | "anon" | null>(null);
  const keywordDebounced = useDebounce(keyword, 300);

  const clearAnonModal = useOverlayState();
  const clearExpiredModal = useOverlayState();

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.get<ListResponse>("/admin/app-cache", {
        pageNo,
        pageSize,
        keyword: keywordDebounced || undefined,
      });
      if (res.code === 200) {
        setItems(res.data?.list || []);
        setTotal(res.data?.total || 0);
      } else {
        setError(res.message || "获取缓存列表失败");
      }
    } catch (err) {
      console.error(err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchList();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo, pageSize, keywordDebounced]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const handleDeleteOne = async (key: string) => {
    setDeletingKey(key);
    try {
      const res = await request.delete<{ deleted: number }>("/admin/app-cache", { key }, { showSuccessMessage: true });
      if (res.code === 200) {
        const isLastItemOnPage = items.length === 1 && pageNo > 1;
        if (isLastItemOnPage) {
          setPageNo((p) => p - 1);
        } else {
          void fetchList();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingKey(null);
    }
  };

  const handleClearExpired = async () => {
    setBulkPending("expired");
    try {
      const res = await request.post<{ deleted: number }>(
        "/admin/app-cache",
        { action: "clearExpired" },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        clearExpiredModal.close();
        void fetchList();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBulkPending(null);
    }
  };

  const handleClearAnonRate = async () => {
    setBulkPending("anon");
    try {
      const res = await request.post<{ deleted: number }>(
        "/admin/app-cache",
        { action: "clearPrefix", prefix: ANON_COMMENT_RATE_CACHE_KEY_PREFIX },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        clearAnonModal.close();
        void fetchList();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBulkPending(null);
    }
  };

  return (
    <div className="h-full space-y-4 bg-canvas p-4 text-text-base">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-base">应用缓存</h1>
          <p className="mt-1 text-sm text-text-muted">
            当前为 PostgreSQL 表 <code className="rounded bg-primary/10 px-1">AppCache</code>
            。可查看、删除单条，或批量清除过期项与匿名评论限流计数。
          </p>
        </div>

        <Alert status="warning">
          <Alert.Title>说明</Alert.Title>
          <Alert.Description>
            删除匿名限流键后，对应 IP 将立即恢复为可留言（在环境变量限额内）。生产环境请谨慎批量清理。
          </Alert.Description>
        </Alert>

        <div className="flex flex-wrap items-end gap-3">
          <TextField className="w-full sm:max-w-[40%]">
            <Label className="text-text-muted">键关键词</Label>
            <Input
              placeholder="按 key 包含匹配，如 ratelimit"
              className="text-text-base"
              value={keyword}
              onChange={(e) => {
                setPageNo(1);
                setKeyword(e.target.value);
              }}
            />
          </TextField>

          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setKeyword("");
              setPageNo(1);
              setPageSize(20);
              router.replace(pathname, { scroll: false });
            }}
          >
            清空筛选
          </Button>

          <Button size="sm" variant="outline" onPress={() => clearExpiredModal.open()}>
            清除已过期
          </Button>

          <Button size="sm" variant="outline" onPress={() => clearAnonModal.open()}>
            清除匿名评论限流
          </Button>
        </div>
      </div>

      <div className="rounded-lg">
        <Table>
          <Table.ScrollContainer className="max-h-[calc(100vh-320px)]">
            <Table.Content aria-label="应用缓存列表">
              <Table.Header>
                <Table.Column isRowHeader>键</Table.Column>
                <Table.Column>值</Table.Column>
                <Table.Column>过期时间</Table.Column>
                <Table.Column>更新时间</Table.Column>
                <Table.Column className="text-center">操作</Table.Column>
              </Table.Header>
              <Table.Body>
                {loading ? (
                  <Table.Row>
                    <Table.Cell colSpan={5}>
                      <div className="flex justify-center py-6">
                        <Spinner color="accent" aria-label="加载中" />
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : error ? (
                  <Table.Row>
                    <Table.Cell colSpan={5}>
                      <span className="text-danger">{error}</span>
                    </Table.Cell>
                  </Table.Row>
                ) : items.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5}>
                      <span className="text-text-muted">暂无缓存条目</span>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  items.map((row) => (
                    <Table.Row key={row.key}>
                      <Table.Cell>
                        <span className="break-all font-mono text-xs text-text-base" title={row.key}>
                          {row.key}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="break-all text-xs text-text-muted" title={row.value}>
                          {shortText(row.value, 80)}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-xs text-text-muted">
                        {formatDt(row.expiresAt)}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-xs text-text-muted">
                        {formatDt(row.updatedAt)}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            variant="danger"
                            isPending={deletingKey === row.key}
                            onPress={() => handleDeleteOne(row.key)}
                          >
                            删除
                          </Button>
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

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="shrink-0 text-sm text-text-muted">
              共 {total} 条，第 {pageNo} / {totalPages} 页
            </span>
            <StringSelect
              aria-label="每页条数"
              className="w-36"
              selectedId={String(pageSize)}
              onSelectionChange={(id) => {
                setPageNo(1);
                setPageSize(Number(id));
              }}
              options={[
                { id: "10", label: "10条/页" },
                { id: "20", label: "20条/页" },
                { id: "50", label: "50条/页" },
                { id: "100", label: "100条/页" },
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
                <span className="text-small px-2 text-text-muted">
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
      ) : null}

      <Modal state={clearExpiredModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.Header>
                <Modal.Heading>清除已过期缓存</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-text-muted">
                  将删除所有「过期时间」早于当前时间的条目（永不过期项不会删除）。
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" onPress={clearExpiredModal.close}>
                  取消
                </Button>
                <Button
                  variant="primary"
                  isPending={bulkPending === "expired"}
                  onPress={() => void handleClearExpired()}
                >
                  确认清除
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={clearAnonModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.Header>
                <Modal.Heading>清除匿名评论限流</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-text-muted">
                  将删除所有以{" "}
                  <code className="break-all rounded bg-primary/10 px-1 text-xs">
                    {ANON_COMMENT_RATE_CACHE_KEY_PREFIX}
                  </code>{" "}
                  开头的键，匿名用户留言频率限制会立即重置。
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" onPress={clearAnonModal.close}>
                  取消
                </Button>
                <Button variant="primary" isPending={bulkPending === "anon"} onPress={() => void handleClearAnonRate()}>
                  确认清除
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

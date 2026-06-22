"use client";

import { StringSelect } from "@/components/admin/string-select";
import { ConfirmDeleteModal } from "@/components/admin/confirm-delete-modal";
import { PaginatedFooter } from "@/components/admin/paginated-footer";
import {
  AdminListLayout,
  AdminListBody,
  AdminListFooter,
  AdminListHeader,
  AdminListOverlays,
  AdminListTable,
  adminTableHeaderClassName,
} from "@/components/admin/admin-list-layout";
import type { AccessLog, VisitorKind } from "@/generated/prisma";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/format-datetime";
import { request } from "@/lib/request";
import type {
  AccessLogPurgeScope,
  AccessLogUserPreview,
} from "@/services/access-log-service";
import {
  Button,
  Chip,
  Input,
  Label,
  Spinner,
  Table,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type SortOrder = "asc" | "desc";

type ListResponse = {
  list: AccessLog[];
  total: number;
  usersById: Record<string, AccessLogUserPreview>;
};

const visitorKindMap: Record<
  VisitorKind,
  { label: string; color: "success" | "warning" | "accent" | "default" }
> = {
  HUMAN: { label: "人类", color: "success" },
  CRAWLER: { label: "爬虫", color: "warning" },
  PREVIEW: { label: "预览", color: "accent" },
  UNKNOWN: { label: "未知", color: "default" },
};

const purgeScopeOptions: { id: AccessLogPurgeScope; label: string }[] = [
  { id: "7", label: "7 天外" },
  { id: "30", label: "30 天外" },
  { id: "60", label: "60 天外" },
  { id: "all", label: "全部" },
];

function shortText(text: string | null | undefined, length = 80) {
  if (!text) return "-";
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

export default function AdminAccessLogListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<AccessLog[]>([]);
  const [usersById, setUsersById] = useState<
    Record<string, AccessLogUserPreview>
  >({});
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pathnameFilter, setPathnameFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [visitorKind, setVisitorKind] = useState<VisitorKind | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purgeScope, setPurgeScope] = useState<AccessLogPurgeScope>("30");
  const [purgePending, setPurgePending] = useState(false);

  const purgeModal = useOverlayState();

  const pathnameDebounced = useDebounce(pathnameFilter, 300);
  const ipDebounced = useDebounce(ipFilter, 300);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.get<ListResponse>("/access-logs", {
        pageNo,
        pageSize,
        sortOrder,
        pathname: pathnameDebounced || undefined,
        ip: ipDebounced || undefined,
        visitorKind: visitorKind === "all" ? undefined : visitorKind,
      });
      if (res.code === 200) {
        setItems(res.data?.list || []);
        setTotal(res.data?.total || 0);
        setUsersById(res.data?.usersById || {});
      } else {
        setError(res.message || "获取访问日志失败");
      }
    } catch (err) {
      console.error("获取访问日志失败:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchLogs();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageNo,
    pageSize,
    pathnameDebounced,
    ipDebounced,
    sortOrder,
    visitorKind,
  ]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  const purgeScopeLabel = useMemo(
    () =>
      purgeScopeOptions.find((option) => option.id === purgeScope)?.label ??
      purgeScope,
    [purgeScope],
  );

  const handlePurge = async () => {
    setPurgePending(true);
    try {
      const res = await request.post<{ deleted: number }>(
        "/access-logs",
        { scope: purgeScope },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        purgeModal.close();
        setPageNo(1);
        void fetchLogs();
      }
    } catch (err) {
      console.error("清除访问日志失败:", err);
    } finally {
      setPurgePending(false);
    }
  };

  return (
    <>
      <AdminListLayout error={error} errorTitle="加载失败">
      <AdminListHeader>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-text-base">访问日志</h1>
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="w-full sm:max-w-[240px]">
              <Label className="text-text-muted">路径</Label>
              <Input
                placeholder="如 /posts/"
                value={pathnameFilter}
                onChange={(e) => {
                  setPageNo(1);
                  setPathnameFilter(e.target.value);
                }}
              />
            </TextField>

            <TextField className="w-full sm:max-w-[180px]">
              <Label className="text-text-muted">IP</Label>
              <Input
                placeholder="客户端 IP"
                value={ipFilter}
                onChange={(e) => {
                  setPageNo(1);
                  setIpFilter(e.target.value);
                }}
              />
            </TextField>

            <StringSelect
              className="w-36"
              label="访客类型"
              selectedId={visitorKind}
              onSelectionChange={(id) => {
                setPageNo(1);
                setVisitorKind(id as VisitorKind | "all");
              }}
              options={[
                { id: "all", label: "全部" },
                { id: "HUMAN", label: "人类" },
                { id: "CRAWLER", label: "爬虫" },
                { id: "PREVIEW", label: "预览" },
                { id: "UNKNOWN", label: "未知" },
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

            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setPathnameFilter("");
                setIpFilter("");
                setVisitorKind("all");
                setSortOrder("desc");
                setPageNo(1);
                setPageSize(20);
                router.replace(pathname, { scroll: false });
              }}
            >
              清空
            </Button>

            <StringSelect
              className="w-32"
              label="清除范围"
              selectedId={purgeScope}
              onSelectionChange={(id) => setPurgeScope(id as AccessLogPurgeScope)}
              options={purgeScopeOptions}
            />

            <Button
              size="sm"
              variant="danger"
              onPress={() => purgeModal.open()}
            >
              清除日志
            </Button>
          </div>
        </div>
      </AdminListHeader>

      <AdminListBody>
        <AdminListTable aria-label="访问日志列表" className="rounded-lg">
          <Table.Header className={adminTableHeaderClassName}>
            <Table.Column isRowHeader>时间</Table.Column>
            <Table.Column>路径</Table.Column>
            <Table.Column>IP</Table.Column>
            <Table.Column>用户</Table.Column>
            <Table.Column>类型</Table.Column>
            <Table.Column>Bot</Table.Column>
            <Table.Column>User-Agent</Table.Column>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <div className="flex justify-center py-3">
                    <Spinner color="accent" aria-label="加载中" />
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : items.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <span className="text-text-muted">暂无数据</span>
                </Table.Cell>
              </Table.Row>
            ) : (
              items.map((item) => {
                const user = item.userId ? usersById[item.userId] : null;
                const kindMeta = visitorKindMap[item.visitorKind];
                return (
                  <Table.Row key={item.id}>
                    <Table.Cell className="whitespace-nowrap text-xs text-text-muted">
                      {formatDateTime(item.createdAt)}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="max-w-[280px]">
                        <span className="break-all font-mono text-sm text-text-base">
                          {item.pathname}
                          {item.query || ""}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="whitespace-nowrap font-mono text-sm text-text-base">
                        {item.ip || "-"}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex max-w-[200px] flex-col">
                        {user ? (
                          <>
                            <span className="line-clamp-1 text-primary">
                              {user.name || user.email}
                            </span>
                            <span className="line-clamp-1 text-xs text-text-muted">
                              {user.email}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-text-muted">-</span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" variant="soft" color={kindMeta.color}>
                        <Chip.Label>{kindMeta.label}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-xs text-text-muted">
                      {item.botName || "-"}
                    </Table.Cell>
                    <Table.Cell>
                      <span
                        className="line-clamp-2 max-w-[320px] text-xs text-text-muted"
                        title={item.userAgent || undefined}
                      >
                        {shortText(item.userAgent, 100)}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </AdminListTable>
      </AdminListBody>

      <AdminListFooter>
        <PaginatedFooter
          total={total}
          pageNo={pageNo}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPageNo}
          onPageSizeChange={(size) => {
            setPageNo(1);
            setPageSize(size);
          }}
        />
      </AdminListFooter>
    </AdminListLayout>

      <AdminListOverlays>
        <ConfirmDeleteModal
          state={purgeModal}
          entityLabel="访问日志"
          entityName={purgeScopeLabel}
          isDeleting={purgePending}
          onConfirm={() => void handlePurge()}
        />
      </AdminListOverlays>
    </>
  );
}

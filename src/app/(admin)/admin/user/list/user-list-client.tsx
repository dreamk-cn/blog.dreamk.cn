"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Button, InputGroup, Table, TextField, Label, Modal, Spinner, useOverlayState } from "@heroui/react";
import { SearchIcon } from "@/components/icons";
import { request } from "@/lib/request";
import { StringSelect } from "@/components/admin/string-select";
import { useDebounce } from "@/hooks/useDebounce";
import type { AdminUserListItem } from "@/services/user-service";

async function loadUsers(kw: string, status: string | undefined): Promise<{ data: AdminUserListItem[]; error: string | null }> {
  try {
    const res = await request.get<AdminUserListItem[]>("/users", { keyword: kw, status });
    if (res.code === 200) return { data: res.data || [], error: null };
    return { data: [], error: res.message || "获取用户失败" };
  } catch {
    return { data: [], error: "获取用户失败" };
  }
}

function UserTableRows({
  users,
  loading,
  updatingId,
  onBan,
  onUnban,
}: {
  users: AdminUserListItem[];
  loading: boolean;
  updatingId: string | null;
  onBan: (user: AdminUserListItem) => void;
  onUnban: (user: AdminUserListItem) => void;
}) {
  if (loading) {
    return (
      <Table.Row>
        <Table.Cell colSpan={6}>
          <div className="flex justify-center py-3">
            <Spinner color="accent" aria-label="加载中" />
          </div>
        </Table.Cell>
      </Table.Row>
    );
  }

  if (users.length === 0) {
    return (
      <Table.Row>
        <Table.Cell colSpan={6}>
          <span className="text-text-muted">暂无数据</span>
        </Table.Cell>
      </Table.Row>
    );
  }

  return users.map((u) => (
    <Table.Row key={u.id}>
      <Table.Cell>
        <span className="text-text-base">{u.name || "-"}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-text-muted">{u.email}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-text-base">{u.role}</span>
      </Table.Cell>
      <Table.Cell>
        <span className={u.status === "BAN" ? "text-error" : "text-text-muted"}>{u.status}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-xs text-text-muted">{new Date(u.createdAt).toLocaleString()}</span>
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-2">
          {u.status !== "BAN" ? (
            <Button
              size="sm"
              variant="danger"
              isDisabled={updatingId === u.id}
              onPress={() => onBan(u)}
            >
              {updatingId === u.id ? "封禁中..." : "封禁"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              isDisabled={updatingId === u.id}
              onPress={() => onUnban(u)}
            >
              {updatingId === u.id ? "解禁中..." : "解禁"}
            </Button>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  ));
}

type AdminUserListClientProps = {
  initialUsers: AdminUserListItem[];
  initialError?: string | null;
};

export default function AdminUserListClient({ initialUsers, initialError = null }: AdminUserListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const didHydrate = useRef(false);
  const [keyword, setKeyword] = useState("");
  const keywordDebounced = useDebounce(keyword, 300);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userToBan, setUserToBan] = useState<AdminUserListItem | null>(null);
  const banConfirmModal = useOverlayState();

  const [listUsers, setListUsers] = useState<AdminUserListItem[]>(initialUsers);
  const [listError, setListError] = useState<string | null>(initialError);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      setListLoading(true);
      const result = await loadUsers(keywordDebounced.trim(), statusFilter);
      if (cancelled) return;
      setListUsers(result.data);
      setListError(result.error);
      setListLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [keywordDebounced, statusFilter, refreshKey]);

  const refresh = () => {
    startTransition(() => {
      setRefreshKey((k) => k + 1);
    });
  };

  const handleBanToggle = async (u: AdminUserListItem, to: "BAN" | "VALID") => {
    try {
      setUpdatingId(u.id);
      const res = await request.put<AdminUserListItem>(
        "/users",
        { id: u.id, status: to },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        refresh();
      }
    } catch (err) {
      console.error("更新用户状态失败", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusSelectId = statusFilter ?? "all";

  const openBanConfirm = (user: AdminUserListItem) => {
    setUserToBan(user);
    banConfirmModal.open();
  };

  const handleConfirmBan = async () => {
    if (!userToBan) return;
    await handleBanToggle(userToBan, "BAN");
    banConfirmModal.close();
    setUserToBan(null);
  };

  return (
    <div className="space-y-4 p-4 text-text-base bg-canvas h-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <TextField className="max-w-sm">
            <Label className="text-text-muted">搜索</Label>
            <InputGroup>
              <InputGroup.Prefix>
                <SearchIcon className="text-base text-text-muted" />
              </InputGroup.Prefix>
              <InputGroup.Input
                value={keyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
                placeholder="搜索姓名或邮箱"
              />
            </InputGroup>
          </TextField>
          <StringSelect
            className="w-40"
            label="状态筛选"
            selectedId={statusSelectId}
            onSelectionChange={(id) => {
              setStatusFilter(id === "all" ? undefined : id);
            }}
            options={[
              { id: "all", label: "全部" },
              { id: "VALID", label: "正常" },
              { id: "BAN", label: "封禁" },
              { id: "DELETED", label: "已删除" },
            ]}
          />
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setKeyword("");
              setStatusFilter(undefined);
              setListUsers(initialUsers);
              setListError(initialError);
              router.replace(pathname, { scroll: false });
            }}
          >
            清空
          </Button>
        </div>
      </div>

      <div className={isPending ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="用户列表">
              <Table.Header>
                <Table.Column isRowHeader>姓名</Table.Column>
                <Table.Column>邮箱</Table.Column>
                <Table.Column>角色</Table.Column>
                <Table.Column>状态</Table.Column>
                <Table.Column>创建时间</Table.Column>
                <Table.Column>操作</Table.Column>
              </Table.Header>
              <Table.Body>
                <UserTableRows
                  users={listUsers}
                  loading={listLoading}
                  updatingId={updatingId}
                  onBan={openBanConfirm}
                  onUnban={(u) => handleBanToggle(u, "VALID")}
                />
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {listError ? (
        <Alert status="danger">
          <Alert.Title>错误</Alert.Title>
          <Alert.Description>{listError}</Alert.Description>
        </Alert>
      ) : null}

      <Modal state={banConfirmModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="bg-canvas inset-ring-error inset-ring-2">
              <Modal.Header>
                <Modal.Heading className="text-text-base">确认封禁用户</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-text-base">
                  确认要封禁用户 &quot;{userToBan?.name || userToBan?.email || "该用户"}&quot; 吗？
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onPress={() => {
                    banConfirmModal.close();
                    setUserToBan(null);
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="danger"
                  isDisabled={!userToBan || updatingId === userToBan.id}
                  onPress={handleConfirmBan}
                >
                  {userToBan && updatingId === userToBan.id ? "封禁中..." : "确认封禁"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

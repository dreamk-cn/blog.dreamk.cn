"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, InputGroup, Table, TextField, Label, Modal, useOverlayState } from "@heroui/react";
import { SearchIcon } from "@/components/icons";
import type { User } from "@prisma/client";
import { request } from "@/libs/request";
import { StringSelect } from "@/components/admin/string-select";

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const banConfirmModal = useOverlayState();

  const fetchUsers = async (kw = "", status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await request.get<User[]>("/users", { keyword: kw, status });
      if (res.code === 200) {
        setUsers(res.data || []);
      } else {
        setError(res.message || "获取用户失败");
      }
    } catch (err) {
      console.error("获取用户失败", err);
      setError("获取用户失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchUsers();
    });
  }, []);

  useEffect(() => {
    let isIgnore = false; // 竞态标记

    const performFetch = async () => {
      // 只有在非防抖状态下或初次加载才调用
      await fetchUsers(keyword.trim(), statusFilter);
    };

    const timer = setTimeout(() => {
      if (!isIgnore) performFetch();
    }, 300);

    return () => {
      isIgnore = true; // 组件卸载或依赖变化时，忽略之前的请求回调
      clearTimeout(timer);
    };
  }, [keyword, statusFilter]);

  const handleBanToggle = async (u: User, to: "BAN" | "VALID") => {
    try {
      setUpdatingId(u.id);
      const res = await request.put<User>(
        "/users",
        { id: u.id, status: to },
        { showSuccessMessage: true }
      );
      if (res.code === 200) {
        fetchUsers(keyword, statusFilter);
      }
    } catch (err) {
      console.error("更新用户状态失败", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const tableItems = useMemo(() => users, [users]);

  const statusSelectId = statusFilter ?? "all";

  const emptyMessage = loading ? "加载中..." : (error || "暂无数据");

  const openBanConfirm = (user: User) => {
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
    <div className="space-y-4 p-4 text-text-base bg-foreground h-full">
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
        </div>
      </div>

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
              {tableItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <span className="text-text-muted">{emptyMessage}</span>
                  </Table.Cell>
                </Table.Row>
              ) : (
                tableItems.map((u) => (
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
                      <span className={u.status === "BAN" ? "text-red-500" : "text-text-muted"}>{u.status}</span>
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
                            onPress={() => openBanConfirm(u)}
                          >
                            {updatingId === u.id ? "封禁中..." : "封禁"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            isDisabled={updatingId === u.id}
                            onPress={() => handleBanToggle(u, "VALID")}
                          >
                            {updatingId === u.id ? "解禁中..." : "解禁"}
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <Modal state={banConfirmModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="bg-foreground inset-ring-error inset-ring-2">
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

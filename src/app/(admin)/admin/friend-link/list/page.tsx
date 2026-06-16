"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StringSelect } from "@/components/admin/string-select";
import {
  AdminListLayout,
  AdminListBody,
  AdminListHeader,
  AdminListOverlays,
  AdminListTable,
  adminTableHeaderClassName,
} from "@/components/admin/admin-list-layout";
import { ConfirmDeleteModal } from "@/components/admin/confirm-delete-modal";
import { SearchIcon } from "@/components/icons";
import { request } from "@/lib/request";
import type { FriendLink, LinkStatus } from "@/generated/prisma";
import {
  Button,
  Input,
  InputGroup,
  Label,
  Modal,
  Spinner,
  Table,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useDebounce } from "@/hooks/useDebounce";
import { siteConfig } from "@/config/site";

type LinkStatusOption = LinkStatus | "all";

const linkStatusOptions: { id: LinkStatusOption; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "PENDING", label: "待审核" },
  { id: "APPROVED", label: "已上线" },
  { id: "REJECTED", label: "已拒绝" },
  { id: "HIDDEN", label: "已隐藏" },
];

async function loadLinks(
  kw: string,
  currentStatus: LinkStatusOption,
): Promise<{ data: FriendLink[]; error: string | null }> {
  try {
    const res = await request.get<FriendLink[]>("/friend-links", {
      keyword: kw || undefined,
      status: currentStatus === "all" ? undefined : currentStatus,
    });
    if (res.code === 200) return { data: res.data || [], error: null };
    return { data: [], error: res.message || "获取友链失败" };
  } catch {
    return { data: [], error: "获取友链失败" };
  }
}

function FriendLinkTableRows({
  items,
  loading,
  deletingId,
  onEdit,
  onDelete,
}: {
  items: FriendLink[];
  loading: boolean;
  deletingId: string | null;
  onEdit: (item: FriendLink) => void;
  onDelete: (item: FriendLink) => void;
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

  if (items.length === 0) {
    return (
      <Table.Row>
        <Table.Cell colSpan={6}>
          <span className="text-text-muted">暂无数据</span>
        </Table.Cell>
      </Table.Row>
    );
  }

  return items.map((item) => (
    <Table.Row key={item.id}>
      <Table.Cell>
        <div className="flex flex-col text-text-base">
          <span>{item.name}</span>
          <span className="text-xs text-text-muted">{item.email || "-"}</span>
        </div>
      </Table.Cell>
      <Table.Cell>
        <span className="text-primary">{item.url}</span>
      </Table.Cell>
      <Table.Cell className="text-text-base">{item.status}</Table.Cell>
      <Table.Cell className="text-text-base">{item.sortOrder}</Table.Cell>
      <Table.Cell>
        <span className="text-xs text-text-muted">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={() => onEdit(item)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="danger"
            isDisabled={deletingId === item.id}
            onPress={() => onDelete(item)}
          >
            {deletingId === item.id ? "删除中..." : "删除"}
          </Button>
        </div>
      </Table.Cell>
    </Table.Row>
  ));
}

export default function AdminFriendLinkListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState("");
  const keywordDebounced = useDebounce(keyword, 300);
  const [status, setStatus] = useState<LinkStatusOption>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const createModal = useOverlayState();
  const editModal = useOverlayState();
  const deleteModal = useOverlayState();

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<LinkStatus>("PENDING");
  const [newSortOrder, setNewSortOrder] = useState("0");

  const [editing, setEditing] = useState<FriendLink | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<LinkStatus>("PENDING");
  const [editSortOrder, setEditSortOrder] = useState("0");

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FriendLink | null>(null);

  const [listItems, setListItems] = useState<FriendLink[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      setListLoading(true);
      const result = await loadLinks(keywordDebounced.trim(), status);
      if (cancelled) return;
      setListItems(result.data);
      setListError(result.error);
      setListLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [keywordDebounced, status, refreshKey]);

  const refresh = () => {
    startTransition(() => {
      setRefreshKey((k) => k + 1);
    });
  };

  const resetCreateForm = () => {
    setNewName("");
    setNewUrl("");
    setNewEmail("");
    setNewAvatar("");
    setNewDescription("");
    setNewStatus("PENDING");
    setNewSortOrder("0");
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    try {
      setCreating(true);
      const res = await request.post<FriendLink>(
        "/friend-links",
        {
          name: newName.trim(),
          url: newUrl.trim(),
          email: newEmail.trim() || undefined,
          avatar: newAvatar.trim() || undefined,
          description: newDescription.trim() || undefined,
          status: newStatus,
          sortOrder: Number(newSortOrder || 0),
        },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        createModal.close();
        resetCreateForm();
        refresh();
      }
    } catch (err) {
      console.error("创建友链失败:", err);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (item: FriendLink) => {
    setEditing(item);
    setEditName(item.name);
    setEditUrl(item.url);
    setEditEmail(item.email || "");
    setEditAvatar(item.avatar || "");
    setEditDescription(item.description || "");
    setEditStatus(item.status);
    setEditSortOrder(String(item.sortOrder));
    editModal.open();
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editName.trim() || !editUrl.trim()) return;

    try {
      setUpdating(true);
      const res = await request.put<FriendLink>(
        "/friend-links",
        {
          id: editing.id,
          name: editName.trim(),
          url: editUrl.trim(),
          email: editEmail.trim() || undefined,
          avatar: editAvatar.trim() || undefined,
          description: editDescription.trim() || undefined,
          status: editStatus,
          sortOrder: Number(editSortOrder || 0),
        },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        editModal.close();
        setEditing(null);
        refresh();
      }
    } catch (err) {
      console.error("更新友链失败:", err);
    } finally {
      setUpdating(false);
    }
  };

  const openDelete = (item: FriendLink) => {
    setItemToDelete(item);
    deleteModal.open();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeletingId(itemToDelete.id);
      const res = await request.delete(
        "/friend-links",
        { id: itemToDelete.id },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        deleteModal.close();
        setItemToDelete(null);
        refresh();
      }
    } catch (err) {
      console.error("删除友链失败:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminListLayout error={listError}>
        <AdminListHeader>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setKeyword(e.target.value)
                    }
                    placeholder="搜索名称、URL、邮箱"
                  />
                </InputGroup>
              </TextField>
              <StringSelect
                className="w-40"
                label="状态筛选"
                selectedId={status}
                onSelectionChange={(id) => setStatus(id as LinkStatusOption)}
                options={linkStatusOptions}
              />
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  setKeyword("");
                  setStatus("all");
                  router.replace(pathname, { scroll: false });
                }}
              >
                清空
              </Button>
            </div>
            <Button variant="primary" onPress={createModal.open}>
              新增友链
            </Button>
          </div>
        </AdminListHeader>

        <AdminListBody>
          <div
            className={
              isPending
                ? "h-full opacity-60 pointer-events-none transition-opacity"
                : "h-full transition-opacity"
            }
          >
            <AdminListTable aria-label="友链列表">
              <Table.Header className={adminTableHeaderClassName}>
                <Table.Column isRowHeader>站点</Table.Column>
                <Table.Column>URL</Table.Column>
                <Table.Column>状态</Table.Column>
                <Table.Column>排序</Table.Column>
                <Table.Column>创建时间</Table.Column>
                <Table.Column>操作</Table.Column>
              </Table.Header>
              <Table.Body>
                <FriendLinkTableRows
                  items={listItems}
                  loading={listLoading}
                  deletingId={deletingId}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              </Table.Body>
            </AdminListTable>
          </div>
        </AdminListBody>
      </AdminListLayout>

      <AdminListOverlays>
        <Modal state={createModal}>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="bg-canvas inset-ring-primary inset-ring-2">
                <Modal.Header>
                  <Modal.Heading className="text-text-base">
                    新增友链
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="grid grid-cols-1 gap-3 p-2">
                  <TextField isRequired>
                    <Label className="text-text-muted">站点名称</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={`例如：${siteConfig.name}`}
                    />
                  </TextField>
                  <TextField isRequired>
                    <Label className="text-text-muted">站点 URL</Label>
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">联系邮箱</Label>
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="demo@example.com"
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">头像 URL</Label>
                    <Input
                      value={newAvatar}
                      onChange={(e) => setNewAvatar(e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">描述</Label>
                    <Input
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="站点简介"
                    />
                  </TextField>
                  <div className="grid grid-cols-2 gap-3">
                    <StringSelect
                      label="状态"
                      selectedId={newStatus}
                      onSelectionChange={(id) => setNewStatus(id as LinkStatus)}
                      options={linkStatusOptions.filter(
                        (item) => item.id !== "all",
                      )}
                    />
                    <TextField>
                      <Label className="text-text-muted">排序值</Label>
                      <Input
                        type="number"
                        value={newSortOrder}
                        onChange={(e) => setNewSortOrder(e.target.value)}
                        placeholder="0"
                        className="text-text-base"
                      />
                    </TextField>
                  </div>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="outline" onPress={createModal.close}>
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={creating || !newName.trim() || !newUrl.trim()}
                    onPress={handleCreate}
                  >
                    {creating ? <Spinner color="current" size="sm" /> : null}
                    {creating ? "提交中..." : "提交"}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

        <Modal state={editModal}>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="bg-canvas inset-ring-primary inset-ring-2">
                <Modal.Header>
                  <Modal.Heading className="text-text-base">
                    编辑友链
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="grid grid-cols-1 gap-3 p-2">
                  <TextField isRequired>
                    <Label className="text-text-muted">站点名称</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={`例如：${siteConfig.name}`}
                    />
                  </TextField>
                  <TextField isRequired>
                    <Label className="text-text-muted">站点 URL</Label>
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">联系邮箱</Label>
                    <Input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="demo@example.com"
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">头像 URL</Label>
                    <Input
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">描述</Label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="站点简介"
                    />
                  </TextField>
                  <div className="grid grid-cols-2 gap-3">
                    <StringSelect
                      label="状态"
                      selectedId={editStatus}
                      onSelectionChange={(id) =>
                        setEditStatus(id as LinkStatus)
                      }
                      options={linkStatusOptions.filter(
                        (item) => item.id !== "all",
                      )}
                    />
                    <TextField>
                      <Label className="text-text-muted">排序值</Label>
                      <Input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(e.target.value)}
                        placeholder="0"
                      />
                    </TextField>
                  </div>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="outline" onPress={editModal.close}>
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={updating || !editName.trim() || !editUrl.trim()}
                    onPress={handleUpdate}
                  >
                    {updating ? "保存中..." : "保存"}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

        <ConfirmDeleteModal
          state={deleteModal}
          entityLabel="友链"
          entityName={itemToDelete?.name ?? ""}
          isDeleting={deletingId !== null}
          onConfirm={handleDelete}
        />
      </AdminListOverlays>
    </>
  );
}

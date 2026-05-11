"use client";

import { StringSelect } from "@/components/admin/string-select";
import { SearchIcon } from "@/components/icons";
import { request } from "@/lib/request";
import type { FriendLink, LinkStatus } from "@prisma/client";
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
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

type LinkStatusOption = LinkStatus | "all";

const linkStatusOptions: { id: LinkStatusOption; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "PENDING", label: "待审核" },
  { id: "APPROVED", label: "已上线" },
  { id: "REJECTED", label: "已拒绝" },
  { id: "HIDDEN", label: "已隐藏" },
];

export default function AdminFriendLinkListPage() {
  const [items, setItems] = useState<FriendLink[]>([]);
  const [keyword, setKeyword] = useState("");
  const keywordDebounced = useDebounce(keyword, 300);
  const [status, setStatus] = useState<LinkStatusOption>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchLinks = async (kw = "", currentStatus: LinkStatusOption = "all") => {
    try {
      setLoading(true);
      setError(null);
      const res = await request.get<FriendLink[]>("/friend-links", {
        keyword: kw || undefined,
        status: currentStatus === "all" ? undefined : currentStatus,
      });
      if (res.code === 200) {
        setItems(res.data || []);
      } else {
        setError(res.message || "获取友链失败");
      }
    } catch (err) {
      console.error("获取友链失败:", err);
      setError("获取友链失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks(keywordDebounced.trim(), status);
  }, [keywordDebounced, status]);

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
        fetchLinks(keyword, status);
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
        fetchLinks(keyword, status);
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
      const res = await request.delete("/friend-links", { id: itemToDelete.id }, { showSuccessMessage: true });
      if (res.code === 200) {
        deleteModal.close();
        setItemToDelete(null);
        fetchLinks(keyword, status);
      }
    } catch (err) {
      console.error("删除友链失败:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const tableItems = useMemo(() => items, [items]);
  const emptyMessage = error || "暂无数据";

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
        </div>
        <Button variant="primary" onPress={createModal.open}>
          新增友链
        </Button>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="友链列表">
            <Table.Header>
              <Table.Column isRowHeader>站点</Table.Column>
              <Table.Column>URL</Table.Column>
              <Table.Column>状态</Table.Column>
              <Table.Column>排序</Table.Column>
              <Table.Column>创建时间</Table.Column>
              <Table.Column>操作</Table.Column>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <div className="flex justify-center py-3">
                      <Spinner color="accent" aria-label="加载中" />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : tableItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <span className="text-text-muted">{emptyMessage}</span>
                  </Table.Cell>
                </Table.Row>
              ) : (
                tableItems.map((item) => (
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
                      <span className="text-xs text-text-muted">{new Date(item.createdAt).toLocaleString()}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onPress={() => openEdit(item)}>
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isDisabled={deletingId === item.id}
                          onPress={() => openDelete(item)}
                        >
                          {deletingId === item.id ? "删除中..." : "删除"}
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

      <Modal state={createModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="bg-foreground inset-ring-primary inset-ring-2">
              <Modal.Header>
                <Modal.Heading className="text-text-base">新增友链</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-3 p-2">
                <TextField isRequired>
                  <Label className="text-text-muted">站点名称</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如：Dreamk Blog" />
                </TextField>
                <TextField isRequired>
                  <Label className="text-text-muted">站点 URL</Label>
                  <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com" />
                </TextField>
                <TextField>
                  <Label className="text-text-muted">联系邮箱</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="demo@example.com" />
                </TextField>
                <TextField>
                  <Label className="text-text-muted">头像 URL</Label>
                  <Input value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} placeholder="https://example.com/logo.png" />
                </TextField>
                <TextField>
                  <Label className="text-text-muted">描述</Label>
                  <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="站点简介" />
                </TextField>
                <div className="grid grid-cols-2 gap-3">
                  <StringSelect
                    label="状态"
                    selectedId={newStatus}
                    onSelectionChange={(id) => setNewStatus(id as LinkStatus)}
                    options={linkStatusOptions.filter((item) => item.id !== "all")}
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
                <Button variant="primary" isDisabled={creating || !newName.trim() || !newUrl.trim()} onPress={handleCreate}>
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
            <Modal.Dialog className="bg-foreground inset-ring-primary inset-ring-2">
              <Modal.Header>
                <Modal.Heading className="text-text-base">编辑友链</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-3 p-2">
                <TextField isRequired>
                  <Label className="text-text-muted">站点名称</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="例如：Dreamk Blog" />
                </TextField>
                <TextField isRequired>
                  <Label className="text-text-muted">站点 URL</Label>
                  <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://example.com" />
                </TextField>
                <TextField>
                  <Label className="text-text-muted">联系邮箱</Label>
                  <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="demo@example.com" />
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
                  <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="站点简介" />
                </TextField>
                <div className="grid grid-cols-2 gap-3">
                  <StringSelect
                    label="状态"
                    selectedId={editStatus}
                    onSelectionChange={(id) => setEditStatus(id as LinkStatus)}
                    options={linkStatusOptions.filter((item) => item.id !== "all")}
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
                <Button variant="primary" isDisabled={updating || !editName.trim() || !editUrl.trim()} onPress={handleUpdate}>
                  {updating ? "保存中..." : "保存"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={deleteModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>删除友链</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>确认要删除友链 &quot;{itemToDelete?.name}&quot; 吗？此操作不可撤销。</p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" onPress={deleteModal.close}>
                  取消
                </Button>
                <Button variant="danger" isDisabled={deletingId !== null} onPress={handleDelete}>
                  {deletingId ? "删除中..." : "确认删除"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

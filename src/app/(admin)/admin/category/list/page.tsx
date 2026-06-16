"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { SearchIcon } from "@/components/icons";
import {
  AdminListLayout,
  AdminListBody,
  AdminListHeader,
  AdminListOverlays,
  AdminListTable,
  adminTableHeaderClassName,
} from "@/components/admin/admin-list-layout";
import { ConfirmDeleteModal } from "@/components/admin/confirm-delete-modal";
import type { Category } from "@/generated/prisma";
import { request } from "@/lib/request";
import { useDebounce } from "@/hooks/useDebounce";

async function loadCategories(
  kw: string,
): Promise<{ data: Category[]; error: string | null }> {
  try {
    const res = await request.get<Category[]>("/categories", { keyword: kw });
    if (res.code === 200) return { data: res.data || [], error: null };
    return { data: [], error: res.message || "获取分类失败" };
  } catch {
    return { data: [], error: "获取分类失败" };
  }
}

function CategoryTableRows({
  categories,
  loading,
  deletingId,
  onEdit,
  onDelete,
}: {
  categories: Category[];
  loading: boolean;
  deletingId: string | null;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  if (loading) {
    return (
      <Table.Row>
        <Table.Cell colSpan={5}>
          <div className="flex justify-center py-3">
            <Spinner color="accent" aria-label="加载中" />
          </div>
        </Table.Cell>
      </Table.Row>
    );
  }

  if (categories.length === 0) {
    return (
      <Table.Row>
        <Table.Cell colSpan={5}>
          <span className="text-text-muted">暂无数据</span>
        </Table.Cell>
      </Table.Row>
    );
  }

  return categories.map((cat) => (
    <Table.Row key={cat.id}>
      <Table.Cell>
        <span className="text-text-base">{cat.name}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-text-muted">{cat.slug}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-xs text-text-muted">
          {new Date(cat.createdAt).toLocaleString()}
        </span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-xs text-text-muted">
          {new Date(cat.updatedAt).toLocaleString()}
        </span>
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={() => onEdit(cat)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="danger"
            isDisabled={deletingId === cat.id}
            onPress={() => onDelete(cat)}
          >
            {deletingId === cat.id ? "删除中..." : "删除"}
          </Button>
        </div>
      </Table.Cell>
    </Table.Row>
  ));
}

export default function AdminCategoryListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState("");
  const keywordDebounced = useDebounce(keyword, 300);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const createModal = useOverlayState();
  const editModal = useOverlayState();
  const deleteModal = useOverlayState();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const [listCategories, setListCategories] = useState<Category[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      setListLoading(true);
      const result = await loadCategories(keywordDebounced.trim());
      if (cancelled) return;
      setListCategories(result.data);
      setListError(result.error);
      setListLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [keywordDebounced, refreshKey]);

  const refresh = () => {
    startTransition(() => {
      setRefreshKey((k) => k + 1);
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setCreating(true);
      const res = await request.post<Category>(
        "/categories",
        { name: newName.trim(), slug: newSlug.trim() },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        createModal.close();
        setNewName("");
        setNewSlug("");
        refresh();
      }
    } catch (err) {
      console.error("创建分类失败", err);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug || "");
    editModal.open();
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editName.trim()) return;
    try {
      setUpdating(true);
      const res = await request.put<Category>(
        "/categories",
        { id: editing.id, name: editName.trim(), slug: editSlug.trim() },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        editModal.close();
        setEditing(null);
        setEditName("");
        setEditSlug("");
        refresh();
      }
    } catch (err) {
      console.error("更新分类失败", err);
    } finally {
      setUpdating(false);
    }
  };

  const openDelete = (category: Category) => {
    setCategoryToDelete(category);
    deleteModal.open();
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeletingId(categoryToDelete.id);
      const res = await request.delete(
        "/categories",
        { id: categoryToDelete.id },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        deleteModal.close();
        setCategoryToDelete(null);
        refresh();
      }
    } catch (err) {
      console.error("删除分类失败", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminListLayout error={listError}>
        <AdminListHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <InputGroup className="max-w-sm">
                <InputGroup.Prefix>
                  <SearchIcon className="text-base text-text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="text-text-base placeholder:text-text-muted"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索分类名称或slug"
                />
              </InputGroup>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  setKeyword("");
                  router.replace(pathname, { scroll: false });
                }}
              >
                清空
              </Button>
            </div>
            <Button variant="primary" onPress={() => createModal.open()}>
              新增分类
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
            <AdminListTable aria-label="分类列表">
              <Table.Header className={adminTableHeaderClassName}>
                <Table.Column isRowHeader>名称</Table.Column>
                <Table.Column>Slug</Table.Column>
                <Table.Column>创建时间</Table.Column>
                <Table.Column>更新时间</Table.Column>
                <Table.Column>操作</Table.Column>
              </Table.Header>
              <Table.Body>
                <CategoryTableRows
                  categories={listCategories}
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
                    新增分类
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-3 p-2">
                  <TextField isRequired>
                    <Label className="text-text-muted">分类名称</Label>
                    <Input
                      className="text-text-base placeholder:text-text-muted"
                      placeholder="例如：技术"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">Slug</Label>
                    <Input
                      className="text-text-base placeholder:text-text-muted"
                      placeholder="例如：tech"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                    />
                  </TextField>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="outline" onPress={createModal.close}>
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={creating || !newName.trim()}
                    onPress={handleCreate}
                  >
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
                    编辑分类
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-3 p-2">
                  <TextField isRequired>
                    <Label className="text-text-muted">分类名称</Label>
                    <Input
                      className="text-text-base placeholder:text-text-muted"
                      placeholder="例如：技术"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </TextField>
                  <TextField>
                    <Label className="text-text-muted">Slug</Label>
                    <Input
                      className="text-text-base placeholder:text-text-muted"
                      placeholder="例如：tech"
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                    />
                  </TextField>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="outline" onPress={editModal.close}>
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={updating || !editName.trim()}
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
          entityLabel="分类"
          entityName={categoryToDelete?.name ?? ""}
          isDeleting={deletingId !== null}
          onConfirm={handleDelete}
        />
      </AdminListOverlays>
    </>
  );
}

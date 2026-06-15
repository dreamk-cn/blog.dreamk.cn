'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
} from '@heroui/react';
import { SearchIcon } from '@/components/icons';
import { AdminListLayout } from '@/components/admin/admin-list-layout';
import { ConfirmDeleteModal } from '@/components/admin/confirm-delete-modal';
import type { Tag } from '@/generated/prisma';
import { request } from '@/lib/request';
import { useDebounce } from '@/hooks/useDebounce';

async function loadTags(kw: string): Promise<{ data: Tag[]; error: string | null }> {
  try {
    const res = await request.get<Tag[]>('/tags', { keyword: kw });
    if (res.code === 200) return { data: res.data || [], error: null };
    return { data: [], error: res.message || '获取标签失败' };
  } catch {
    return { data: [], error: '获取标签失败' };
  }
}

function TagTableRows({
  tags,
  loading,
  deletingId,
  onEdit,
  onDelete,
}: {
  tags: Tag[];
  loading: boolean;
  deletingId: string | null;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
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

  if (tags.length === 0) {
    return (
      <Table.Row>
        <Table.Cell colSpan={5}>
          <span className="text-text-muted">暂无数据</span>
        </Table.Cell>
      </Table.Row>
    );
  }

  return tags.map((tag) => (
    <Table.Row key={tag.id}>
      <Table.Cell>
        <span className="text-text-base">{tag.name}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-text-muted">{tag.slug}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-xs text-text-muted">{new Date(tag.createdAt).toLocaleString()}</span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-xs text-text-muted">{new Date(tag.updatedAt).toLocaleString()}</span>
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={() => onEdit(tag)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="danger"
            isDisabled={deletingId === tag.id}
            onPress={() => onDelete(tag)}
          >
            {deletingId === tag.id ? '删除中...' : '删除'}
          </Button>
        </div>
      </Table.Cell>
    </Table.Row>
  ));
}

export default function AdminTagListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState('');
  const keywordDebounced = useDebounce(keyword, 300);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const createModal = useOverlayState();
  const editModal = useOverlayState();
  const deleteModal = useOverlayState();

  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const [listTags, setListTags] = useState<Tag[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      setListLoading(true);
      const result = await loadTags(keywordDebounced.trim());
      if (cancelled) return;
      setListTags(result.data);
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      setCreating(true);
      const res = await request.post<Tag>(
        '/tags',
        { name: newTagName.trim(), slug: newTagSlug.trim() },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        createModal.close();
        setNewTagName('');
        setNewTagSlug('');
        refresh();
      } else {
        console.warn(res.message || '创建标签失败');
      }
    } catch (err) {
      console.error('创建标签失败', err);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag);
    setEditName(tag.name);
    setEditSlug(tag.slug || '');
    editModal.open();
  };

  const handleUpdateTag = async () => {
    if (!editing) return;
    if (!editName.trim()) return;
    try {
      setUpdating(true);
      const res = await request.put<Tag>(
        '/tags',
        { id: editing.id, name: editName.trim(), slug: editSlug.trim() },
        { showSuccessMessage: true },
      );
      if (res.code === 200) {
        editModal.close();
        setEditing(null);
        setEditName('');
        setEditSlug('');
        refresh();
      }
    } catch (err) {
      console.error('更新标签失败', err);
    } finally {
      setUpdating(false);
    }
  };

  const openDelete = (tag: Tag) => {
    setTagToDelete(tag);
    deleteModal.open();
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    try {
      setDeletingId(tagToDelete.id);
      const res = await request.delete('/tags', { id: tagToDelete.id }, { showSuccessMessage: true });
      if (res.code === 200) {
        deleteModal.close();
        setTagToDelete(null);
        refresh();
      }
    } catch (err) {
      console.error('删除标签失败', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminListLayout error={listError}>
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
              placeholder="搜索标签名称或slug"
            />
          </InputGroup>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setKeyword('');
              router.replace(pathname, { scroll: false });
            }}
          >
            清空
          </Button>
        </div>
        <Button variant="primary" onPress={() => createModal.open()}>
          新增标签
        </Button>
      </div>

      <div className={isPending ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="标签列表">
              <Table.Header>
                <Table.Column isRowHeader>名称</Table.Column>
                <Table.Column>Slug</Table.Column>
                <Table.Column>创建时间</Table.Column>
                <Table.Column>更新时间</Table.Column>
                <Table.Column>操作</Table.Column>
              </Table.Header>
              <Table.Body>
                <TagTableRows
                  tags={listTags}
                  loading={listLoading}
                  deletingId={deletingId}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <Modal state={createModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="bg-canvas inset-ring-primary inset-ring-2">
              <Modal.Header>
                <Modal.Heading className="text-text-base">新增标签</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3 p-2">
                <TextField isRequired>
                  <Label className="text-text-muted">标签名称</Label>
                  <Input
                    className="text-text-base placeholder:text-text-muted"
                    placeholder="例如：前端"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                </TextField>
                <TextField>
                  <Label className="text-text-muted">Slug</Label>
                  <Input
                    className="text-text-base placeholder:text-text-muted"
                    placeholder="例如：frontend"
                    value={newTagSlug}
                    onChange={(e) => setNewTagSlug(e.target.value)}
                  />
                </TextField>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" onPress={createModal.close}>
                  取消
                </Button>
                <Button
                  variant="primary"
                  isDisabled={creating || !newTagName.trim()}
                  onPress={handleCreateTag}
                >
                  {creating ? '提交中...' : '提交'}
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
                <Modal.Heading className="text-text-base">编辑标签</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3 p-2">
                <TextField isRequired>
                  <Label className="text-text-muted">标签名称</Label>
                  <Input
                    className="text-text-base placeholder:text-text-muted"
                    placeholder="例如：前端"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </TextField>
                <TextField>
                  <Label className="text-text-muted">Slug</Label>
                  <Input
                    className="text-text-base placeholder:text-text-muted"
                    placeholder="例如：frontend"
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
                  onPress={handleUpdateTag}
                >
                  {updating ? '保存中...' : '保存'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ConfirmDeleteModal
        state={deleteModal}
        entityLabel="标签"
        entityName={tagToDelete?.name ?? ''}
        isDeleting={deletingId !== null}
        onConfirm={handleDelete}
      />
    </AdminListLayout>
  );
}

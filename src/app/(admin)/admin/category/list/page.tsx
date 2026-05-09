'use client';

import { useEffect, useMemo, useState } from 'react';
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
import type { Category } from '@prisma/client';
import { request } from '@/libs/request';
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminCategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState('');
  const keywordDebounced = useDebounce(keyword, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createModal = useOverlayState();
  const editModal = useOverlayState();
  const deleteModal = useOverlayState();

  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // useEffect(() => {
  //   if (!newSlug) {
  //     setNewSlug(newName.trim().toLowerCase().replace(/\s+/g, '-'));
  //   }
  // }, [newName, newSlug]);

  const fetchCategories = async (kw = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await request.get<Category[]>('/categories', { keyword: kw });
      if (res.code === 200) {
        setCategories(res.data || []);
      } else {
        setError(res.message || '获取分类失败');
      }
    } catch (err) {
      setError('获取分类失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(keywordDebounced.trim());
  }, [keywordDebounced]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setCreating(true);
      const res = await request.post<Category>(
        '/categories',
        { name: newName.trim(), slug: newSlug.trim() },
        { showSuccessMessage: true }
      );
      if (res.code === 200) {
        createModal.close();
        setNewName('');
        setNewSlug('');
        fetchCategories(keyword);
      }
    } catch (err) {
      console.error('创建分类失败', err);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug || '');
    editModal.open();
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editName.trim()) return;
    try {
      setUpdating(true);
      const res = await request.put<Category>(
        '/categories',
        { id: editing.id, name: editName.trim(), slug: editSlug.trim() },
        { showSuccessMessage: true }
      );
      if (res.code === 200) {
        editModal.close();
        setEditing(null);
        setEditName('');
        setEditSlug('');
        fetchCategories(keyword);
      }
    } catch (err) {
      console.error('更新分类失败', err);
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
      const res = await request.delete('/categories', { id: categoryToDelete.id }, { showSuccessMessage: true });
      if (res.code === 200) {
        deleteModal.close();
        setCategoryToDelete(null);
        fetchCategories(keyword);
      }
    } catch (err) {
      console.error('删除分类失败', err);
    } finally {
      setDeletingId(null);
    }
  };

  const tableItems = useMemo(() => categories, [categories]);

  const emptyMessage = error || '暂无数据';

  return (
    <div className="space-y-4 p-4 text-text-base bg-foreground h-full">
      <div className="flex items-center justify-between gap-3">
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
        <Button variant="primary" onPress={() => createModal.open()}>
          新增分类
        </Button>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="分类列表">
            <Table.Header>
              <Table.Column isRowHeader>名称</Table.Column>
              <Table.Column>Slug</Table.Column>
              <Table.Column>创建时间</Table.Column>
              <Table.Column>更新时间</Table.Column>
              <Table.Column>操作</Table.Column>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <div className="flex justify-center py-3">
                      <Spinner color="accent" aria-label="加载中" />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : tableItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <span className="text-text-muted">{emptyMessage}</span>
                  </Table.Cell>
                </Table.Row>
              ) : (
                tableItems.map((cat) => (
                  <Table.Row key={cat.id}>
                    <Table.Cell>
                      <span className="text-text-base">{cat.name}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-text-muted">{cat.slug}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-xs text-text-muted">{new Date(cat.createdAt).toLocaleString()}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-xs text-text-muted">{new Date(cat.updatedAt).toLocaleString()}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onPress={() => openEdit(cat)}>
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isDisabled={deletingId === cat.id}
                          onPress={() => openDelete(cat)}
                        >
                          {deletingId === cat.id ? '删除中...' : '删除'}
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
                <Modal.Heading className="text-text-base">新增分类</Modal.Heading>
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
            <Modal.Dialog className="bg-foreground inset-ring-primary inset-ring-2">
              <Modal.Header>
                <Modal.Heading className="text-text-base">编辑分类</Modal.Heading>
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
                  {updating ? '保存中...' : '保存'}
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
                <Modal.Heading>删除分类</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>确认要删除分类 &quot;{categoryToDelete?.name}&quot; 吗？此操作不可撤销。</p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" onPress={deleteModal.close}>
                  取消
                </Button>
                <Button
                  variant="danger"
                  isDisabled={deletingId !== null}
                  onPress={handleDelete}
                >
                  {deletingId ? '删除中...' : '确认删除'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

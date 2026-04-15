'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  InputGroup,
  Label,
  Modal,
  Table,
  TextField,
  useOverlayState,
} from '@heroui/react';
import { SearchIcon } from '@/components/icons';
import type { Tag } from '@prisma/client';
import { request } from '@/libs/request';

export default function AdminTagListPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!newTagSlug) {
      setNewTagSlug(newTagName.trim().toLowerCase().replace(/\s+/g, '-'));
    }
  }, [newTagName, newTagSlug]);

  const fetchTags = async (kw = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await request.get<Tag[]>('/tags', { keyword: kw });
      if (res.code === 200) {
        setTags(res.data || []);
      } else {
        setError(res.message || '获取标签失败');
      }
    } catch (err) {
      setError('获取标签失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTags(keyword.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      setCreating(true);
      const res = await request.post<Tag>(
        '/tags',
        { name: newTagName.trim(), slug: newTagSlug.trim() },
        { showSuccessMessage: true }
      );
      if (res.code === 200) {
        createModal.close();
        setNewTagName('');
        setNewTagSlug('');
        fetchTags(keyword);
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
        { showSuccessMessage: true }
      );
      if (res.code === 200) {
        editModal.close();
        setEditing(null);
        setEditName('');
        setEditSlug('');
        fetchTags(keyword);
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
        fetchTags(keyword);
      }
    } catch (err) {
      console.error('删除标签失败', err);
    } finally {
      setDeletingId(null);
    }
  };

  const tableItems = useMemo(() => tags, [tags]);

  const emptyMessage = loading ? '加载中...' : (error || '暂无数据');

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <InputGroup className="max-w-sm">
          <InputGroup.Prefix>
            <SearchIcon className="text-base text-default-400" />
          </InputGroup.Prefix>
          <InputGroup.Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标签名称或slug"
          />
        </InputGroup>
        <Button variant="primary" onPress={() => createModal.open()}>
          新增标签
        </Button>
      </div>

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
              {tableItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <span className="text-default-400">{emptyMessage}</span>
                  </Table.Cell>
                </Table.Row>
              ) : (
                tableItems.map((tag) => (
                  <Table.Row key={tag.id}>
                    <Table.Cell>{tag.name}</Table.Cell>
                    <Table.Cell>{tag.slug}</Table.Cell>
                    <Table.Cell>{new Date(tag.createdAt).toLocaleString()}</Table.Cell>
                    <Table.Cell>{new Date(tag.updatedAt).toLocaleString()}</Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onPress={() => openEdit(tag)}>
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isDisabled={deletingId === tag.id}
                          onPress={() => openDelete(tag)}
                        >
                          {deletingId === tag.id ? '删除中...' : '删除'}
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
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>新增标签</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired>
                <Label>标签名称</Label>
                <Input
                  placeholder="例如：前端"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </TextField>
              <TextField>
                <Label>Slug</Label>
                <Input
                  placeholder="例如：frontend"
                  value={newTagSlug}
                  onChange={(e) => setNewTagSlug(e.target.value)}
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="ghost" onPress={createModal.close}>
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
      </Modal>

      <Modal state={editModal}>
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>编辑标签</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired>
                <Label>标签名称</Label>
                <Input
                  placeholder="例如：前端"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </TextField>
              <TextField>
                <Label>Slug</Label>
                <Input
                  placeholder="例如：frontend"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="ghost" onPress={editModal.close}>
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
      </Modal>

      <Modal state={deleteModal}>
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>删除标签</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>确认要删除标签 &quot;{tagToDelete?.name}&quot; 吗？此操作不可撤销。</p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="ghost" onPress={deleteModal.close}>
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
      </Modal>
    </div>
  );
}

'use client'

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { SearchIcon } from '@/components/icons';
import type { Tag } from '@prisma/client';
import { request } from '@/libs/request';

export default function AdminTagListPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  // 自动根据名称生成 slug
  useEffect(() => {
    if (!newTagSlug) {
      setNewTagSlug(newTagName.trim().toLowerCase().replace(/\s+/g, '-'))
    }
  }, [newTagName, newTagSlug])

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

  // 搜索输入防抖
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
        setIsCreateOpen(false);
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
    setIsEditOpen(true);
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
        setIsEditOpen(false);
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
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    try {
      setDeletingId(tagToDelete.id);
      const res = await request.delete('/tags', { id: tagToDelete.id }, { showSuccessMessage: true });
      if (res.code === 200) {
        setIsDeleteOpen(false);
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索标签名称或slug"
          startContent={<SearchIcon className="text-base text-default-400" />}
          className="max-w-sm"
        />
        <Button color="primary" onPress={() => setIsCreateOpen(true)}>新增标签</Button>
      </div>

      <Table aria-label="标签列表">
        <TableHeader>
          <TableColumn>名称</TableColumn>
          <TableColumn>Slug</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>更新时间</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody emptyContent={loading ? '加载中...' : (error || '暂无数据')} items={tableItems}>
          {tableItems.map(tag => (
            <TableRow key={tag.id}>
              <TableCell>{tag.name}</TableCell>
              <TableCell>{tag.slug}</TableCell>
              <TableCell>{new Date(tag.createdAt).toLocaleString()}</TableCell>
              <TableCell>{new Date(tag.updatedAt).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onPress={() => openEdit(tag)}>编辑</Button>
                  <Button size="sm" color="danger" isDisabled={deletingId === tag.id} onPress={() => openDelete(tag)}>
                    {deletingId === tag.id ? '删除中...' : '删除'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>新增标签</ModalHeader>
              <ModalBody>
                <Input
                  label="标签名称"
                  placeholder="例如：前端"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  isRequired
                />
                <Input
                  label="Slug"
                  placeholder="例如：frontend"
                  value={newTagSlug}
                  onChange={(e) => setNewTagSlug(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onPress={onClose}>取消</Button>
                <Button color="primary" isDisabled={creating || !newTagName.trim()} onPress={handleCreateTag}>
                  {creating ? '提交中...' : '提交'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>编辑标签</ModalHeader>
              <ModalBody>
                <Input
                  label="标签名称"
                  placeholder="例如：前端"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  isRequired
                />
                <Input
                  label="Slug"
                  placeholder="例如：frontend"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onPress={onClose}>取消</Button>
                <Button color="primary" isDisabled={updating || !editName.trim()} onPress={handleUpdateTag}>
                  {updating ? '保存中...' : '保存'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>删除标签</ModalHeader>
              <ModalBody>
                <p>确认要删除标签 &quot;{tagToDelete?.name}&quot; 吗？此操作不可撤销。</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onPress={onClose}>取消</Button>
                <Button color="danger" isDisabled={deletingId !== null} onPress={handleDelete}>
                  {deletingId ? '删除中...' : '确认删除'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
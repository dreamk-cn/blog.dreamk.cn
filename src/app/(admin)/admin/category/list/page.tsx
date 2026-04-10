'use client'

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { SearchIcon } from '@/components/icons';
import type { Category } from '@prisma/client';
import { request } from '@/libs/request';

export default function AdminCategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // 自动根据名称生成 slug
  useEffect(() => {
    if (!newSlug) {
      setNewSlug(newName.trim().toLowerCase().replace(/\s+/g, '-'))
    }
  }, [newName, newSlug])

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
    fetchCategories();
  }, []);

  // 搜索输入防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories(keyword.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

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
        setIsCreateOpen(false);
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
    setIsEditOpen(true);
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
        setIsEditOpen(false);
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
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeletingId(categoryToDelete.id);
      const res = await request.delete('/categories', { id: categoryToDelete.id }, { showSuccessMessage: true });
      if (res.code === 200) {
        setIsDeleteOpen(false);
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索分类名称或slug"
          startContent={<SearchIcon className="text-base text-default-400" />}
          className="max-w-sm"
        />
        <Button color="primary" onPress={() => setIsCreateOpen(true)}>新增分类</Button>
      </div>

      <Table aria-label="分类列表">
        <TableHeader>
          <TableColumn>名称</TableColumn>
          <TableColumn>Slug</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>更新时间</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody emptyContent={loading ? '加载中...' : (error || '暂无数据')} items={tableItems}>
          {tableItems.map(cat => (
            <TableRow key={cat.id}>
              <TableCell>{cat.name}</TableCell>
              <TableCell>{cat.slug}</TableCell>
              <TableCell>{new Date(cat.createdAt).toLocaleString()}</TableCell>
              <TableCell>{new Date(cat.updatedAt).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onPress={() => openEdit(cat)}>编辑</Button>
                  <Button size="sm" color="danger" isDisabled={deletingId === cat.id} onPress={() => openDelete(cat)}>
                    {deletingId === cat.id ? '删除中...' : '删除'}
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
              <ModalHeader>新增分类</ModalHeader>
              <ModalBody>
                <Input
                  label="分类名称"
                  placeholder="例如：技术"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  isRequired
                />
                <Input
                  label="Slug"
                  placeholder="例如：tech"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onPress={onClose}>取消</Button>
                <Button color="primary" isDisabled={creating || !newName.trim()} onPress={handleCreate}>
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
              <ModalHeader>编辑分类</ModalHeader>
              <ModalBody>
                <Input
                  label="分类名称"
                  placeholder="例如：技术"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  isRequired
                />
                <Input
                  label="Slug"
                  placeholder="例如：tech"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onPress={onClose}>取消</Button>
                <Button color="primary" isDisabled={updating || !editName.trim()} onPress={handleUpdate}>
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
              <ModalHeader>删除分类</ModalHeader>
              <ModalBody>
                <p>确认要删除分类 &quot;{categoryToDelete?.name}&quot; 吗？此操作不可撤销。</p>
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
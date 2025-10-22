'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { request } from '@/libs/request';
import type { Post, Category, Tag } from '@prisma/client';
import { Button, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Select, SelectItem, Chip, Alert } from '@heroui/react';
import { useDebounce } from '@/hooks/useDebounce';

type PostItem = Post & { category: Category | null; tags: Tag[] };

type ListResponse = { list: PostItem[]; total: number };

type SortBy = 'createdAt' | 'updatedAt' | 'title';
type SortOrder = 'asc' | 'desc';
type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export default function Posts() {
  const [items, setItems] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<Status>('PUBLISHED');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const keywordDebounced = useDebounce(keyword, 300);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.get<ListResponse>('/posts', {
        pageNo,
        pageSize,
        keyword: keywordDebounced || undefined,
        sortBy,
        sortOrder,
        status,
      });
      if (res.code === 200) {
        setItems(res.data?.list || []);
        setTotal(res.data?.total || 0);
      } else {
        setError(res.message || '获取文章列表失败');
      }
    } catch (err) {
      console.error(err);
      setError('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo, pageSize, sortBy, sortOrder, status, keywordDebounced]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await request.request<{ success: boolean }>({
        method: 'DELETE',
        url: '/post',
        data: { ids: [id] },
        showSuccessMessage: true,
      });
      if (res.code === 200) {
        // 删除成功后刷新列表
        // 如果当前页只有一条且被删除，翻到上一页
        const isLastItemOnPage = items.length === 1 && pageNo > 1;
        if (isLastItemOnPage) {
          setPageNo(pageNo - 1);
        } else {
          fetchPosts();
        }
      } else {
        console.warn('删除文章失败:', res.message);
      }
    } catch (err) {
      console.error('删除文章失败:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/post/create">
          <Button color="primary">新增文章</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-64">
          <Input
            label="关键词"
            placeholder="按标题或内容搜索"
            value={keyword}
            onChange={(e) => {
              setPageNo(1);
              setKeyword(e.target.value);
            }}
          />
        </div>

        <div className="w-40">
          <Select
            label="状态"
            value={status}
            onSelectionChange={(id) => {
              setPageNo(1);
              setStatus(id.currentKey as Status);
            }}
          >
            <SelectItem key="DRAFT">草稿</SelectItem>
            <SelectItem key="PUBLISHED">已发布</SelectItem>
            <SelectItem key="ARCHIVED">已归档</SelectItem>
          </Select>
        </div>

        <div className="w-40">
          <Select
            label="排序字段"
            value={sortBy}
            onSelectionChange={(id) => {
              setPageNo(1);
              setSortBy(id.currentKey as SortBy);
            }}
          >
            <SelectItem key="createdAt">创建时间</SelectItem>
            <SelectItem key="updatedAt">更新时间</SelectItem>
            <SelectItem key="title">标题</SelectItem>
          </Select>
        </div>

        <div className="w-40">
          <Select
            label="排序方式"
            value={sortOrder}
            onSelectionChange={(id) => {
              setPageNo(1);
              setSortOrder(id.currentKey as SortOrder);
            }}
          >
            <SelectItem key="desc">倒序</SelectItem>
            <SelectItem key="asc">正序</SelectItem>
          </Select>
        </div>
      </div>

      <div className="bg-content1 rounded-lg">
        <Table aria-label="文章列表" isHeaderSticky>
          <TableHeader>
            <TableColumn>标题</TableColumn>
            <TableColumn>分类</TableColumn>
            <TableColumn>标签</TableColumn>
            <TableColumn>状态</TableColumn>
            <TableColumn>置顶</TableColumn>
            <TableColumn>创建时间</TableColumn>
            <TableColumn>更新时间</TableColumn>
            <TableColumn>操作</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={loading ? '加载中...' : '暂无数据'}
            isLoading={loading}
          >
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">{item.title}</span>
                    <span className="text-xs text-default-500">{item.slug}</span>
                  </div>
                </TableCell>
                <TableCell>{item.category?.name || '-'}</TableCell>
                <TableCell>
                  {item.tags?.length ? (
                    <div className="flex gap-2 flex-wrap">
                      {item.tags.map((t) => (
                        <Chip color='primary' key={t.id} size="sm" variant="flat">
                          {t.name}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <span className="text-default-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">{item.status}</Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">{item.featured ? '是' : '否'}</Chip>
                </TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/post/create?type=edit&id=${item.id}`}>
                      <Button size="sm" variant="flat">编辑</Button>
                    </Link>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      isLoading={deletingId === item.id}
                      onPress={() => handleDelete(item.id)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-default-500">共 {total} 条</div>
        <div className="flex items-center gap-2">
          <Select
            aria-label="每页条数"
            className="w-32"
            value={String(pageSize)}
            onSelectionChange={(id) => {
              setPageNo(1);
              setPageSize(Number(id.currentKey));
            }}
          >
            <SelectItem key="10">10条/页</SelectItem>
            <SelectItem key="20">20条/页</SelectItem>
            <SelectItem key="50">50条/页</SelectItem>
          </Select>
          <Button
            variant="flat"
            isDisabled={pageNo <= 1 || loading}
            onPress={() => setPageNo((n) => Math.max(1, n - 1))}
          >上一页</Button>
          <span className="min-w-[80px] text-center text-sm">{pageNo} / {totalPages}</span>
          <Button
            variant="flat"
            isDisabled={pageNo >= totalPages || loading}
            onPress={() => setPageNo((n) => Math.min(totalPages, n + 1))}
          >下一页</Button>
        </div>
      </div>

      {error ? (
        <Alert color="danger" title="错误" description={error} />
      ) : null}
    </div>
  );
}

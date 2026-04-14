'use client';

import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { request } from '@/libs/request';
import type { Post, Category, Tag } from '@prisma/client';
import { Button, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Select, SelectItem, Chip, Alert, Pagination, Link } from '@heroui/react';
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

  const topContent = useMemo(() => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Button 
          as={NextLink} 
          href="/admin/post/create" 
          color="primary"
          variant="shadow"
        >
          新增文章
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Input
          isClearable
          className="w-full sm:max-w-[30%]"
          label="关键词"
          placeholder="按标题或内容搜索"
          value={keyword}
          onValueChange={(v) => {
            setPageNo(1);
            setKeyword(v);
          }}
        />

        <Select
          className="max-w-xs w-40"
          label="状态"
          selectedKeys={[status]}
          onSelectionChange={(keys) => {
            setPageNo(1);
            setStatus(Array.from(keys)[0] as Status);
          }}
        >
          <SelectItem key="DRAFT">草稿</SelectItem>
          <SelectItem key="PUBLISHED">已发布</SelectItem>
          <SelectItem key="ARCHIVED">已归档</SelectItem>
        </Select>

        <Select
          className="max-w-xs w-40"
          label="排序字段"
          selectedKeys={[sortBy]}
          onSelectionChange={(keys) => {
            setPageNo(1);
            setSortBy(Array.from(keys)[0] as SortBy);
          }}
        >
          <SelectItem key="createdAt">创建时间</SelectItem>
          <SelectItem key="updatedAt">更新时间</SelectItem>
          <SelectItem key="title">标题</SelectItem>
        </Select>

        <Select
          className="max-w-xs w-28"
          label="方向"
          selectedKeys={[sortOrder]}
          onSelectionChange={(keys) => {
            setPageNo(1);
            setSortOrder(Array.from(keys)[0] as SortOrder);
          }}
        >
          <SelectItem key="desc">倒序</SelectItem>
          <SelectItem key="asc">正序</SelectItem>
        </Select>
      </div>
    </div>
  ), [keyword, status, sortBy, sortOrder]);

  const bottomContent = useMemo(() => (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-4">
        <span className="text-small text-default-400">共 {total} 条数据</span>
        <Select
          aria-label="每页条数"
          className="w-32"
          size="sm"
          selectedKeys={[String(pageSize)]}
          onSelectionChange={(keys) => {
            setPageNo(1);
            setPageSize(Number(Array.from(keys)[0]));
          }}
        >
          <SelectItem key="10">10条/页</SelectItem>
          <SelectItem key="20">20条/页</SelectItem>
          <SelectItem key="50">50条/页</SelectItem>
        </Select>
      </div>
      <Pagination
        isCompact
        showControls
        showShadow
        color="primary"
        page={pageNo}
        total={totalPages}
        onChange={setPageNo}
      />
    </div>
  ), [pageNo, totalPages, total, pageSize]);

  return (
    <div className="p-4 space-y-4">
      {topContent}

      <div className="bg-content1 rounded-lg">
        <Table 
          aria-label="文章列表" 
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
        >
          <TableHeader>
            <TableColumn>标题</TableColumn>
            <TableColumn>分类</TableColumn>
            <TableColumn>标签</TableColumn>
            <TableColumn>状态</TableColumn>
            <TableColumn>置顶</TableColumn>
            <TableColumn>创建时间</TableColumn>
            <TableColumn>更新时间</TableColumn>
            <TableColumn align="center">操作</TableColumn>
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
                    <div className="flex gap-1 flex-wrap">
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
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color={item.status === 'PUBLISHED' ? 'success' : item.status === 'ARCHIVED' ? 'warning' : 'default'}
                  >
                    {item.status === 'PUBLISHED' ? '已发布' : item.status === 'ARCHIVED' ? '已归档' : '草稿'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color={item.featured ? 'primary' : 'default'}
                  >
                    {item.featured ? '是' : '否'}
                  </Chip>
                </TableCell>
                <TableCell className="text-xs">{new Date(item.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-xs">{new Date(item.updatedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      as={NextLink} 
                      href={`/admin/post/create?type=edit&id=${item.id}`}
                      size="sm" 
                      variant="flat"
                    >
                      编辑
                    </Button>
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

      {error ? (
        <Alert color="danger" title="错误" className="mt-4">{error}</Alert>
      ) : null}
    </div>
  );
}

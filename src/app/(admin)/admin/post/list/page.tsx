'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { request } from '@/lib/request';
import type { Post, Category, Tag } from '@prisma/client';
import {
  Alert,
  Button,
  Chip,
  Input,
  Label,
  Pagination,
  Spinner,
  Table,
  TextField,
} from '@heroui/react';
import { useDebounce } from '@/hooks/useDebounce';
import { StringSelect } from '@/components/admin/string-select';

type PostItem = Post & { category: Category | null; tags: Tag[] };

type ListResponse = { list: PostItem[]; total: number };

type SortBy = 'createdAt' | 'updatedAt' | 'title';
type SortOrder = 'asc' | 'desc';
type Status = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export default function Posts() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<Status>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [loading, setLoading] = useState(true);
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
        status: status === 'ALL' ? undefined : status,
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
    queueMicrotask(() => {
      fetchPosts();
    });
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
    <div className="flex flex-col gap-4 text-text-base">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Button
          variant="primary"
          onPress={() => router.push('/admin/post/create')}
        >
          新增文章
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <TextField className="w-full sm:max-w-[30%]">
          <Label className="text-text-muted">关键词</Label>
          <Input
            className="text-text-base"
            placeholder="按标题或内容搜索"
            value={keyword}
            onChange={(e) => {
              setPageNo(1);
              setKeyword(e.target.value);
            }}
          />
        </TextField>

        <StringSelect
          className="w-40 text-text-muted"
          label="状态"
          selectedId={status}
          onSelectionChange={(id) => {
            setPageNo(1);
            setStatus(id as Status);
          }}
          options={[
            { id: 'ALL', label: '全部' },
            { id: 'DRAFT', label: '草稿' },
            { id: 'PUBLISHED', label: '已发布' },
            { id: 'ARCHIVED', label: '已归档' },
          ]}
        />

        <StringSelect
          className="w-40 text-text-muted"
          label="排序字段"
          selectedId={sortBy}
          onSelectionChange={(id) => {
            setPageNo(1);
            setSortBy(id as SortBy);
          }}
          options={[
            { id: 'createdAt', label: '创建时间' },
            { id: 'updatedAt', label: '更新时间' },
            { id: 'title', label: '标题' },
          ]}
        />

        <StringSelect
          className="w-28 text-text-muted"
          label="方向"
          selectedId={sortOrder}
          onSelectionChange={(id) => {
            setPageNo(1);
            setSortOrder(id as SortOrder);
          }}
          options={[
            { id: 'desc', label: '倒序' },
            { id: 'asc', label: '正序' },
          ]}
        />

        <Button
          size="sm"
          variant="secondary"
          className="text-text-muted"
          onPress={() => {
            setKeyword('');
            setStatus('ALL');
            setSortBy('createdAt');
            setSortOrder('desc');
            setPageNo(1);
            setPageSize(10);
            router.replace(pathname, { scroll: false });
          }}
        >
          清空
        </Button>
      </div>
    </div>
  ), [keyword, status, sortBy, sortOrder, router, pathname]);

  const bottomContent = useMemo(() => (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-muted shrink-0">共 {total} 条数据</span>
        <StringSelect
          aria-label="每页条数"
          className="w-32"
          selectedId={String(pageSize)}
          onSelectionChange={(id) => {
            setPageNo(1);
            setPageSize(Number(id));
          }}
          options={[
            { id: '10', label: '10条/页' },
            { id: '20', label: '20条/页' },
            { id: '50', label: '50条/页' },
          ]}
        />
      </div>
      <Pagination>
        <Pagination.Content className="gap-1">
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={pageNo <= 1}
              onPress={() => setPageNo((p) => Math.max(1, p - 1))}
            >
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item>
            <span className="px-2 text-small text-default-600">
              {pageNo} / {totalPages}
            </span>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next
              isDisabled={pageNo >= totalPages}
              onPress={() => setPageNo((p) => Math.min(totalPages, p + 1))}
            >
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  ), [pageNo, totalPages, total, pageSize]);

  return (
    <div className="space-y-4 p-4 bg-foreground h-full">
      {topContent}

      <div className="rounded-lg bg-content1">
        <Table>
          <Table.ScrollContainer className="max-h-[calc(100vh-280px)]">
            <Table.Content aria-label="文章列表">
              <Table.Header>
                <Table.Column isRowHeader>标题</Table.Column>
                <Table.Column>分类</Table.Column>
                <Table.Column>标签</Table.Column>
                <Table.Column>状态</Table.Column>
                <Table.Column>置顶</Table.Column>
                <Table.Column>创建时间</Table.Column>
                <Table.Column>更新时间</Table.Column>
                <Table.Column className="text-center">操作</Table.Column>
              </Table.Header>
              <Table.Body>
                {loading ? (
                  <Table.Row>
                    <Table.Cell colSpan={8}>
                      <div className="flex justify-center py-3">
                        <Spinner color="accent" aria-label="加载中" />
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : items.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={8}>
                      <span className="text-default-400">暂无数据</span>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  items.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        <div className="flex flex-col">
                          <span className="line-clamp-1 font-medium text-text-base">{item.title}</span>
                          <span className="text-xs text-text-muted">{item.slug}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="text-text-muted">{item.category?.name || '-'}</Table.Cell>
                      <Table.Cell>
                        {item.tags?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((t) => (
                              <Chip key={t.id} size="sm" variant="soft" color="accent">
                                <Chip.Label className="text-text-base">{t.name}</Chip.Label>
                              </Chip>
                            ))}
                          </div>
                        ) : (
                          <span className="text-default-400 text-text-muted">-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={
                            item.status === 'PUBLISHED'
                              ? 'success'
                              : item.status === 'ARCHIVED'
                                ? 'warning'
                                : 'default'
                          }
                        >
                          <Chip.Label>
                            {item.status === 'PUBLISHED'
                              ? '已发布'
                              : item.status === 'ARCHIVED'
                                ? '已归档'
                                : '草稿'}
                          </Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={item.featured ? 'accent' : 'default'}
                        >
                          <Chip.Label>{item.featured ? '是' : '否'}</Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-xs text-text-base">{new Date(item.createdAt).toLocaleString()}</Table.Cell>
                      <Table.Cell className="text-xs text-text-base">{new Date(item.updatedAt).toLocaleString()}</Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() =>
                              router.push(`/admin/post/create?type=edit&id=${item.id}`)
                            }
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            isPending={deletingId === item.id}
                            onPress={() => handleDelete(item.id)}
                          >
                            删除
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
      </div>

      {bottomContent}

      {error ? (
        <Alert status="danger">
          <Alert.Title>错误</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      ) : null}
    </div>
  );
}

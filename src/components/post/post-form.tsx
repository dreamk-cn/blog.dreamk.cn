'use client';

import { toast, Button, Card, Chip, Description, FieldError, Form, Input, Label, Switch, TextArea, TextField } from "@heroui/react";
import { Category, Post, PostStatus, Tag } from "@prisma/client";
import { useState } from "react";
import { request } from '@/libs/request';
import { useRouter } from 'next/navigation';
import { StringSelect } from '@/components/admin/string-select';

interface PostDetail extends Post {
  tags: Tag[],
  category: Category
}

type FormErrors = Partial<Record<'title' | 'slug' | 'content' | 'excerpt', string>>

function createExcerptFromContent(content: string, maxLength = 160) {
  const plainText = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_\-\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength)}...`;
}

export function PostForm({
  article,
  categories = [],
  tags = [],
  onSubmit,
  onCancel
}: {
  article?: PostDetail,
  categories?: Partial<Category>[],
  tags?: Partial<Tag>[],
  onSubmit?: (article: Partial<Post>) => void,
  onCancel?: () => void
}) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    excerpt: article?.excerpt || '',
    content: article?.content || '',
    status: article?.status || 'DRAFT',
    categoryId: article?.categoryId || undefined,
    featured: article?.featured || false,
    tags: article?.tags || [],
    coverUrl: article?.coverUrl || ''
  })

  const [newTag, setNewTag] = useState('')

  function handleTagSelect(tag: Tag) {
    setFormData(prev => {
      const tagExists = prev.tags.some(t => t.id === tag.id);
      if (tagExists) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t.id !== tag.id)
        };
      }
      return {
        ...prev,
        tags: [...prev.tags, tag]
      };
    });
  }

  function handleAddNewTag() {
    if (newTag.trim() && !tags.some(tag => tag.name?.toLowerCase() === newTag.trim().toLowerCase())) {
      const newTagObject: Tag = {
        id: `temp-${Date.now()}`,
        name: newTag.trim(),
        slug: newTag.trim().toLowerCase().replace(/ /g, '-'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTagObject]
      }));

      setNewTag('');
    }
  }

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const validationErrors: FormErrors = {};
    if (!formData.title.trim()) {
      validationErrors.title = '标题不能为空';
    }
    if (!formData.slug.trim()) {
      validationErrors.slug = 'Slug不能为空';
    }
    if (!formData.content.trim()) {
      validationErrors.content = '内容不能为空';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast(`表单校验未通过：${Object.values(validationErrors).join("、")}`);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        excerpt: formData.excerpt.trim() || createExcerptFromContent(formData.content),
        tags: formData.tags.map(tag => ({
          id: tag.id.startsWith('temp-') ? undefined : tag.id,
          name: tag.name,
          slug: tag.slug
        }))
      };

      if (onSubmit) {
        onSubmit(submitData);
        return;
      }

      let response;
      if (article?.id) {
        response = await request.put(`/post`, {
          ...submitData,
          id: article.id
        });
      } else {
        response = await request.post('/post', submitData);
      }

      if (response.code === 200) {
        toast(article?.id ? '文章更新成功' : '文章发布成功');
        router.back();
      } else {
        toast(response.message || '操作失败');
      }
    } catch (error) {
      console.error('提交表单时出错:', error);
      toast('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = [
    { id: '', label: '选择文章分类' },
    ...categories
      .filter((c): c is Category & { id: string } => Boolean(c.id))
      .map((c) => ({ id: c.id, label: c.name ?? '' })),
  ];

  return (
    <Card className="mx-auto w-full shadow-none">
      <Card.Header className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-bold">
          #{article?.id ? '编辑文章' : '发布文章'}
        </h2>
        <div className="flex gap-2">
          {article && (
            <Button variant="secondary">
              预览
            </Button>
          )}
        </div>
      </Card.Header>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField isRequired isInvalid={!!errors.title}>
              <Label>文章标题</Label>
              <Description>文章标题</Description>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </TextField>
            <TextField isRequired isInvalid={!!errors.slug}>
              <Label>Slug</Label>
              <Description>将用于生成文章URL</Description>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              />
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
            </TextField>

            <StringSelect
              className="w-full"
              label="文章分类"
              selectedId={formData.categoryId ?? ''}
              onSelectionChange={(id) =>
                setFormData((prev) => ({ ...prev, categoryId: id || undefined }))
              }
              options={categoryOptions}
            />

            <StringSelect
              className="w-full"
              label="文章状态"
              selectedId={formData.status}
              onSelectionChange={(id) =>
                setFormData((prev) => ({ ...prev, status: id as PostStatus }))
              }
              options={[
                { id: 'DRAFT', label: '草稿' },
                { id: 'PUBLISHED', label: '已发布' },
                { id: 'ARCHIVED', label: '已归档' },
              ]}
            />

            <TextField isInvalid={!!errors.excerpt} className="md:col-span-2">
              <Label>文章摘要</Label>
              <Description>文章摘要</Description>
              <TextArea
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              />
              {errors.excerpt ? <FieldError>{errors.excerpt}</FieldError> : null}
            </TextField>

            <TextField className="md:col-span-2">
              <Label>封面图片URL</Label>
              <Description>文章封面图片URL</Description>
              <Input
                value={formData.coverUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, coverUrl: e.target.value }))}
              />
            </TextField>

            <TextField isRequired isInvalid={!!errors.content} className="md:col-span-2">
              <Label>文章内容</Label>
              <Description>文章内容</Description>
              <TextArea
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
              {errors.content ? <FieldError>{errors.content}</FieldError> : null}
            </TextField>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              isSelected={formData.featured}
              onChange={(v) => setFormData(prev => ({ ...prev, featured: v }))}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <span className="text-sm">置顶文章</span>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">文章标签</label>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  variant={formData.tags.find(t => t.id === tag.id) ? "primary" : "secondary"}
                  color={formData.tags.find(t => t.id === tag.id) ? "accent" : "default"}
                  className="cursor-pointer"
                  onClick={() => handleTagSelect(tag as Tag)}
                >
                  <Chip.Label>{tag.name}</Chip.Label>
                </Chip>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="输入新标签"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="max-w-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                onPress={handleAddNewTag}
              >
                添加
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-default-600">已选择标签: </span>
                {formData.tags.map(tag => (
                  <Chip
                    key={tag.id}
                    variant="soft"
                    color="accent"
                    size="sm"
                    className="ml-1"
                  >
                    <Chip.Label>{tag.name}</Chip.Label>
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </Card.Content>

        <div className="flex justify-end gap-3 border-t p-4">
          {onCancel && (
            <Button variant="ghost" onPress={onCancel} isDisabled={loading}>
              取消
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isDisabled={loading}
            isPending={loading}
          >
            {loading ? '提交中...' : (article?.id ? '更新文章' : '发布文章')}
          </Button>
        </div>
      </Form>
    </Card>
  )
}

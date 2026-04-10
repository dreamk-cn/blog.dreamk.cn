'use client';

import { addToast, Button, Card, CardBody, CardHeader, Chip, Form, Input, Select, SelectItem, Switch, Textarea } from "@heroui/react";
import { Category, Post, PostStatus, Tag } from "@prisma/client";
import { useState } from "react";
import { request } from '@/libs/request';
import { useRouter } from 'next/navigation';

interface PostDetail extends Post {
  tags: Tag[],
  category: Category
}

type FormErrors = Partial<Record<'title' | 'slug' | 'content' | 'excerpt', string>>

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

  // 处理标签选择
  function handleTagSelect(tag: Tag) {
    setFormData(prev => {
      const tagExists = prev.tags.some(t => t.id === tag.id);
      if (tagExists) {
        // 如果标签已存在，则移除
        return {
          ...prev,
          tags: prev.tags.filter(t => t.id !== tag.id)
        };
      } else {
        // 如果标签不存在，则添加
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  }

  // 处理添加新标签
  function handleAddNewTag() {
    if (newTag.trim() && !tags.some(tag => tag.name?.toLowerCase() === newTag.trim().toLowerCase())) {
      // 创建一个临时的新标签对象
      const newTagObject: Tag = {
        id: `temp-${Date.now()}`, // 临时ID，提交时会被实际ID替代
        name: newTag.trim(),
        slug: newTag.trim().toLowerCase().replace(/ /g, '-'),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 添加到表单数据中
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTagObject]
      }));
      
      // 清空输入框
      setNewTag('');
    }
  }

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  return (
    <Card className="w-full mx-auto" shadow="none">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-bold">
          #{ article?.id ? '编辑文章' : '发布文章' }
        </h2>
        <div className="flex gap-2">
          { article && (
            <Button color="default" variant="flat">
              预览
            </Button>
          )}
        </div>
      </CardHeader>

      <Form>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="文章标题"
              description="文章标题"
              isRequired
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={errors.title ? "border-red-500" : ""}
            />
            <Input
              label="Slug"
              description="将用于生成文章URL"
              isRequired
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className={errors.slug ? "border-red-500" : ""}
            />

            <Select
              label="文章分类"
              placeholder="选择文章分类"
              selectedKeys={formData.categoryId ? [formData.categoryId] : []}
              onSelectionChange={(k) => setFormData(prev => ({ ...prev, categoryId: k.currentKey }))}
            >
              {categories.map(category => (
                <SelectItem key={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="文章状态"
              placeholder="选择状态"
              defaultSelectedKeys={[formData.status]}
              value={formData.status}
              onSelectionChange={(id) => setFormData(prev => ({ ...prev, status: id.currentKey as PostStatus }))}
            >
              <SelectItem key='DRAFT'>
                草稿
              </SelectItem>
              <SelectItem key='PUBLISHED'>
                已发布
              </SelectItem>
              <SelectItem key='ARCHIVED'>
                已归档
              </SelectItem>
            </Select>

            {/* 摘要 */}
            <Textarea
              label="文章摘要"
              description="文章摘要"
              minRows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              className={errors.excerpt ? "border-red-500" : ""}
            />

            {/* 封面图片 */}
            <Input
              label="封面图片URL"
              description="文章封面图片URL"
              value={formData.coverUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, coverUrl: e.target.value }))}
            />

            {/* 内容 */}
            <Textarea
              label="文章内容"
              description="文章内容"
              minRows={10}
              isRequired
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className={errors.content ? "border-red-500" : ""}
            />
          </div>
          <Switch 
            isSelected={formData.featured}
            onValueChange={(v) => setFormData(prev => ({ ...prev, featured: v }))}
          >置顶文章</Switch>
          {/* 标签选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">文章标签</label>
            
            {/* 现有标签选择 */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  variant={formData.tags.find(t => t.id === tag.id) ? "solid" : "bordered"}
                  color={formData.tags.find(t => t.id === tag.id) ? "primary" : "default"}
                  className="cursor-pointer"
                  onClick={() => handleTagSelect(tag as Tag)}
                >
                  {tag.name}
                </Chip>
              ))}
            </div>

            {/* 添加新标签 */}
            <div className="flex gap-2">
              <Input
                placeholder="输入新标签"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                size="sm"
              />
              <Button 
                size="sm" 
                variant="flat" 
                onPress={handleAddNewTag}
              >
                添加
              </Button>
            </div>

            {/* 已选标签显示 */}
            {formData.tags.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-default-600">已选择标签: </span>
                {formData.tags.map(tag => (
                  <Chip 
                    key={tag.id} 
                    variant="flat" 
                    color="primary" 
                    size="sm" 
                    className="ml-1"
                  >
                    {tag.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </CardBody>
        
        {/* 表单操作按钮 */}
        <div className="flex justify-end gap-3 p-4 border-t">
          {onCancel && (
            <Button variant="ghost" onPress={onCancel} disabled={loading}>
              取消
            </Button>
          )}
          <Button 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? '提交中...' : (article?.id ? '更新文章' : '发布文章')}
          </Button>
        </div>
      </Form>
    </Card>
  )
  
  // 表单提交处理
  async function handleSubmit() {
    // 简单验证
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
    if (!formData.excerpt.trim()) {
      validationErrors.excerpt = '摘要不能为空';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);
    
    try {
      // 准备提交数据
      const submitData = {
        ...formData,
        // 将标签转换为API需要的格式
        tags: formData.tags.map(tag => ({
          id: tag.id.startsWith('temp-') ? undefined : tag.id,
          name: tag.name,
          slug: tag.slug
        }))
      };
      
      // 如果有自定义提交回调，则调用
      if (onSubmit) {
        onSubmit(submitData);
        return;
      }
      
      // 调用API
      let response;
      if (article?.id) {
        // 更新文章
        response = await request.put(`/post`, {
          ...submitData,
          id: article.id
        });
      } else {
        // 创建文章
        response = await request.post('/post', submitData);
      }
      
      if (response.code === 200) {
        addToast({
          title: article?.id ? '文章更新成功' : '文章发布成功',
        })
        router.back();
      } else {
        addToast({
          title: response.message || '操作失败'
        })
      }
    } catch (error) {
      console.error('提交表单时出错:', error);
      addToast({
        title: '网络错误，请稍后再试'
      })
    } finally {
      setLoading(false);
    }
  }
}
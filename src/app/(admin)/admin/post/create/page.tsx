'use client';

import { PostForm } from "@/components/post/post-form";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { request } from "@/lib/request";
import { Alert, Spinner } from "@heroui/react";
import type { Post, Category, Tag } from "@/generated/prisma";

export default function PostCreatePage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') === 'edit' ? 'edit' : 'create';
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  const [article, setArticle] = useState<Post & { tags: Tag[], category: Category } | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          request.get<Category[]>('/categories'),
          request.get<Tag[]>('/tags'),
        ]);

        if (categoriesResponse.code === 200) {
          setCategories(categoriesResponse.data || []);
        }

        if (tagsResponse.code === 200) {
          setTags(tagsResponse.data || []);
        }
      } catch (err) {
        console.error('获取分类和标签失败:', err);
      } finally {
        setMetaLoading(false);
      }
    };

    void fetchCategoriesAndTags();
  }, []);

  useEffect(() => {
    if (type !== 'edit' || (!id && !slug)) return;

    const fetchArticle = async () => {
      setArticleLoading(true);
      setError(null);
      try {
        const response = await request.get<Post & { tags: Tag[], category: Category }>(
          `/post?${id ? `id=${id}` : `slug=${slug}`}`,
        );

        if (response.code === 200) {
          setArticle(response.data);
        } else {
          setError('获取文章失败: ' + response.message);
        }
      } catch (err) {
        console.error('获取文章失败:', err);
        setError('网络错误，请稍后再试');
      } finally {
        setArticleLoading(false);
      }
    };

    void fetchArticle();
  }, [type, id, slug]);

  if (metaLoading || (type === 'edit' && articleLoading)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-text-muted">{type === 'edit' ? '正在加载文章…' : '正在加载表单…'}</p>
      </div>
    );
  }

  if (error && type === 'edit') {
    return (
      <div className="p-4 sm:p-6">
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>加载失败</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-canvas p-4 sm:p-6">
      <PostForm
        key={article?.id ?? type}
        article={article}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}

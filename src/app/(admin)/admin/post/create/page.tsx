'use client';

import { PostForm } from "@/components/post/post-form";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { request } from "@/lib/request";
import type { Post, Category, Tag } from "@prisma/client";

export default function Post() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') === 'edit' ? 'edit' : 'create';
  const id = searchParams.get('id');
  const slug = searchParams.get('slug')

  const [article, setArticle] = useState<Post & { tags: Tag[], category: Category } | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取分类和标签数据
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          request.get<Category[]>('/categories'),
          request.get<Tag[]>('/tags')
        ]);
        
        if (categoriesResponse.code === 200) {
          setCategories(categoriesResponse.data || []);
        }
        
        if (tagsResponse.code === 200) {
          setTags(tagsResponse.data || []);
        }
      } catch (err) {
        console.error('获取分类和标签失败:', err);
      }
    };

    fetchCategoriesAndTags();
  }, []);

  // 如果是编辑模式，获取文章数据
  useEffect(() => {
    if (type === 'edit' && (id || slug)) {
      const fetchArticle = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await request.get<Post & { tags: Tag[], category: Category }>(`/post?${id ? `id=${id}` : `slug=${slug}`}`);
          
          if (response.code === 200) {
            setArticle(response.data);
          } else {
            setError('获取文章失败: ' + response.message);
          }
        } catch (err) {
          console.error('获取文章失败:', err);
          setError('网络错误，请稍后再试');
        } finally {
          setLoading(false);
        }
      };

      fetchArticle();
    }
  }, [type, id, slug]);

  if (loading) {
    return (
      <div className="p-3">
        <h1 className="text-xl font-semibold">加载中...</h1>
      </div>
    );
  }

  if (error && type === 'edit') {
    return (
      <div className="p-3">
        <div className="text-error mb-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-foreground min-h-full">
      <PostForm 
        article={article}
        categories={categories}
        tags={tags}
      />
    </div>
  )
}
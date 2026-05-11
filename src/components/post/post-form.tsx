'use client';

import {
  toast,
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Switch,
  TextArea,
  TextField,
  Tabs,
} from "@heroui/react";
import { Category, Post, PostStatus, Tag } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { request, type HttpError } from "@/lib/request";
import { normalizeSlug } from "@/lib/slug";
import { StringSelect } from "@/components/admin/string-select";
import { ArticleMarkdown } from "@/components/post/article-markdown";

interface PostDetail extends Post {
  tags: Tag[];
  category: Category | null;
}

type FormTag = Pick<Tag, "id" | "name" | "slug">;

type PostFormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  categoryId?: string;
  featured: boolean;
  tags: FormTag[];
  coverUrl: string;
};

type FormErrors = Partial<Record<"title" | "slug" | "content" | "excerpt" | "coverUrl", string>>;

const emptyFormData: PostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "DRAFT",
  categoryId: undefined,
  featured: false,
  tags: [],
  coverUrl: "",
};

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

function formDataFromArticle(article?: PostDetail): PostFormData {
  if (!article) return emptyFormData;

  return {
    title: article.title || "",
    slug: article.slug || "",
    excerpt: article.excerpt || "",
    content: article.content || "",
    status: article.status || "DRAFT",
    categoryId: article.categoryId || undefined,
    featured: article.featured || false,
    tags: article.tags || [],
    coverUrl: article.coverUrl || "",
  };
}

function isFormDirty(formData: PostFormData, baseline: PostFormData) {
  return JSON.stringify(formData) !== JSON.stringify(baseline);
}

function readLocalDraft(articleId: string | undefined, draftKey: string) {
  if (articleId || typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(draftKey);
  if (!saved) return null;

  try {
    return { ...emptyFormData, ...(JSON.parse(saved) as PostFormData) };
  } catch {
    window.localStorage.removeItem(draftKey);
    return null;
  }
}

function validateForm(formData: PostFormData): FormErrors {
  const errors: FormErrors = {};
  const slug = normalizeSlug(formData.slug);

  if (!formData.title.trim()) {
    errors.title = "标题不能为空";
  }
  if (!formData.slug.trim()) {
    errors.slug = "Slug 不能为空";
  } else if (slug !== formData.slug.trim()) {
    errors.slug = "Slug 只能包含小写字母、数字和连字符";
  }
  if (!formData.content.trim()) {
    errors.content = "内容不能为空";
  }
  if (formData.coverUrl.trim()) {
    try {
      new URL(formData.coverUrl.trim());
    } catch {
      errors.coverUrl = "封面图片 URL 格式不正确";
    }
    if (formData.coverUrl.trim().length > 100) {
      errors.coverUrl = "封面图片 URL 不能超过 100 个字符";
    }
  }

  return errors;
}

export function PostForm({
  article,
  categories = [],
  tags = [],
  onSubmit,
  onCancel,
}: {
  article?: PostDetail;
  categories?: Partial<Category>[];
  tags?: Partial<Tag>[];
  onSubmit?: (article: Partial<Post>) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const baseline = useMemo(() => formDataFromArticle(article), [article]);
  const draftKey = `admin-post-draft:${article?.id ?? "create"}`;

  const [formData, setFormData] = useState<PostFormData>(baseline);
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [generatingExcerpt, setGeneratingExcerpt] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [previewMode, setPreviewMode] = useState<"write" | "preview">("write");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (article?.id) return;

    const timer = window.setTimeout(() => {
      const draft = readLocalDraft(article?.id, draftKey);
      if (!draft) return;
      setFormData(draft);
      setLastSavedAt("已恢复本地草稿");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [article?.id, draftKey]);

  useEffect(() => {
    if (!isFormDirty(formData, baseline)) return;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(draftKey, JSON.stringify(formData));
      setLastSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    }, 800);

    return () => window.clearTimeout(timer);
  }, [baseline, draftKey, formData]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isFormDirty(formData, baseline)) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [baseline, formData]);

  function updateField<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "title" || key === "slug" || key === "content" || key === "excerpt" || key === "coverUrl") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleTagSelect(tag: Tag) {
    setFormData((prev) => {
      const tagExists = prev.tags.some((t) => t.id === tag.id);
      if (tagExists) {
        return {
          ...prev,
          tags: prev.tags.filter((t) => t.id !== tag.id),
        };
      }
      return {
        ...prev,
        tags: [...prev.tags, tag],
      };
    });
  }

  function handleAddNewTag() {
    const trimmed = newTag.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const inCatalog = tags.some((tag) => tag.name?.toLowerCase() === lower);
    const alreadySelected = formData.tags.some((tag) => tag.name?.toLowerCase() === lower);
    if (inCatalog || alreadySelected) {
      toast("标签已存在");
      return;
    }

    const newTagObject: FormTag = {
      id: `temp-${Date.now()}`,
      name: trimmed,
      slug: normalizeSlug(trimmed, 50),
    };

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, newTagObject],
    }));
    setNewTag("");
  }

  async function handleGenerateSlug() {
    if (!formData.title.trim()) {
      setErrors((prev) => ({ ...prev, title: "请先填写文章标题" }));
      toast("请先填写文章标题");
      return;
    }

    setGeneratingSlug(true);
    try {
      const response = await request.post<{ slug: string }>("/ai/slug", {
        title: formData.title,
        content: formData.content.trim() ? formData.content : undefined,
      });
      const generated = normalizeSlug(response.data?.slug ?? "");

      if (!generated) {
        toast("未生成有效 slug，请重试");
        return;
      }

      updateField("slug", generated);
      toast("Slug 生成成功");
    } catch (error) {
      console.error("生成 slug 失败:", error);
      toast("生成 slug 失败，请稍后再试");
    } finally {
      setGeneratingSlug(false);
    }
  }

  async function handleGenerateExcerpt() {
    if (!formData.content.trim()) {
      setErrors((prev) => ({ ...prev, content: "请先填写文章内容" }));
      toast("请先填写文章内容");
      return;
    }

    setGeneratingExcerpt(true);
    try {
      const response = await request.post<{ excerpt: string }>("/ai/excerpt", {
        content: formData.content,
      });
      const generatedExcerpt = response.data?.excerpt?.trim();

      if (!generatedExcerpt) {
        toast("未生成有效摘要，请重试");
        return;
      }

      updateField("excerpt", generatedExcerpt);
      toast("摘要生成成功");
    } catch (error) {
      console.error("生成摘要失败:", error);
      toast("生成摘要失败，请稍后再试");
    } finally {
      setGeneratingExcerpt(false);
    }
  }

  async function handleSubmit(statusOverride?: PostStatus) {
    const nextFormData = {
      ...formData,
      slug: normalizeSlug(formData.slug),
      status: statusOverride ?? formData.status,
      coverUrl: formData.coverUrl.trim(),
    };
    const validationErrors = validateForm(nextFormData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast(`表单校验未通过：${Object.values(validationErrors).join("，")}`);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const submitData = {
        ...nextFormData,
        excerpt: nextFormData.excerpt.trim() || createExcerptFromContent(nextFormData.content),
        tags: nextFormData.tags.map((tag) => ({
          id: tag.id.startsWith("temp-") ? undefined : tag.id,
          name: tag.name,
          slug: normalizeSlug(tag.slug || tag.name, 50),
        })),
      };

      if (onSubmit) {
        onSubmit(submitData);
        return;
      }

      const response = article?.id
        ? await request.put("/post", { ...submitData, id: article.id })
        : await request.post("/post", submitData);

      if (response.code === 200) {
        window.localStorage.removeItem(draftKey);
        toast(article?.id ? "文章更新成功" : submitData.status === "PUBLISHED" ? "文章发布成功" : "草稿保存成功");
        router.push("/admin/post/list");
      } else {
        toast(response.message || "操作失败");
      }
    } catch (error) {
      const message = (error as HttpError).message || "网络错误，请稍后再试";
      if (message.includes("Slug")) {
        setErrors((prev) => ({ ...prev, slug: message }));
      }
      console.error("提交表单时出错:", error);
      toast(message);
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = [
    { id: "", label: "选择文章分类" },
    ...categories
      .filter((category): category is Category & { id: string } => Boolean(category.id))
      .map((category) => ({ id: category.id, label: category.name ?? "" })),
  ];

  const selectedTagIds = new Set(formData.tags.map((tag) => tag.id));
  const charCount = formData.content.replace(/\s/g, "").length;
  const readMinutes = Math.max(1, Math.ceil(charCount / 500));
  const submitText = loading
    ? "提交中..."
    : article?.id
      ? "更新文章"
      : formData.status === "PUBLISHED"
        ? "发布文章"
        : "保存文章";

  return (
    <Card className="mx-auto w-full bg-foreground">
      <Card.Header className="border-b rounded-2xl border-border bg-background/70 px-5 py-4">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold leading-7 text-text-base sm:text-xl">
                {article?.id ? "编辑文章" : "创建文章"}
              </h2>
              <span className="rounded-md bg-default-100 px-2 py-0.5 text-xs font-medium text-text-muted">
                {formData.status === "PUBLISHED" ? "发布" : formData.status === "ARCHIVED" ? "归档" : "草稿"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span className="rounded-md border border-border bg-foreground px-2.5 py-1">{charCount} 字</span>
              <span className="rounded-md border border-border bg-foreground px-2.5 py-1">约 {readMinutes} 分钟阅读</span>
              {lastSavedAt ? (
                <span className="rounded-md border border-border bg-foreground px-2.5 py-1">{lastSavedAt}</span>
              ) : null}
            </div>
          </div>
          <Tabs
            className="w-full sm:w-[180px]"
            selectedKey={previewMode}
            onSelectionChange={(key) => setPreviewMode(String(key) === "preview" ? "preview" : "write")}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Options">
                <Tabs.Tab id="write" className="text-text-base">
                  编辑
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="preview" className="text-text-base">
                  预览
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      </Card.Header>

      <Form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField isRequired isInvalid={!!errors.title}>
              <Label className="text-text-muted">文章标题</Label>
              <Description>用于后台识别和前台文章标题展示</Description>
              <Input className="text-text-base" value={formData.title} onChange={(event) => updateField("title", event.target.value)} />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </TextField>

            <TextField isRequired isInvalid={!!errors.slug}>
              <Label className="text-text-muted">Slug</Label>
              <Description>用于生成文章 URL，只允许小写字母、数字和连字符</Description>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  className="text-text-base flex-1"
                  value={formData.slug}
                  onBlur={() => updateField("slug", normalizeSlug(formData.slug))}
                  onChange={(event) => updateField("slug", event.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="shrink-0 sm:self-auto"
                  onPress={handleGenerateSlug}
                  isDisabled={loading || generatingSlug}
                  isPending={generatingSlug}
                >
                  {generatingSlug ? "生成中..." : "AI 生成 Slug"}
                </Button>
              </div>
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
            </TextField>

            <StringSelect
              className="w-full"
              label="文章分类"
              selectedId={formData.categoryId ?? ""}
              onSelectionChange={(id) => updateField("categoryId", id || undefined)}
              options={categoryOptions}
            />

            <StringSelect
              className="w-full"
              label="文章状态"
              selectedId={formData.status}
              onSelectionChange={(id) => updateField("status", id as PostStatus)}
              options={[
                { id: "DRAFT", label: "草稿" },
                { id: "PUBLISHED", label: "已发布" },
                { id: "ARCHIVED", label: "已归档" },
              ]}
            />

            <TextField isInvalid={!!errors.excerpt} className="md:col-span-2">
              <Label className="text-text-muted">文章摘要</Label>
              <Description>可手动编辑；留空提交时会根据正文自动截取</Description>
              <TextArea className="text-text-base" rows={2} value={formData.excerpt} onChange={(event) => updateField("excerpt", event.target.value)} />
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={handleGenerateExcerpt}
                  isDisabled={loading || generatingExcerpt}
                  isPending={generatingExcerpt}
                >
                  {generatingExcerpt ? "生成中..." : "AI 生成摘要"}
                </Button>
              </div>
              {errors.excerpt ? <FieldError>{errors.excerpt}</FieldError> : null}
            </TextField>

            <TextField isInvalid={!!errors.coverUrl} className="md:col-span-2">
              <Label className="text-text-muted">封面图片 URL</Label>
              <Description>可选，长度需控制在 100 个字符内</Description>
              <Input className="text-text-base" value={formData.coverUrl} onChange={(event) => updateField("coverUrl", event.target.value)} />
              {errors.coverUrl ? <FieldError>{errors.coverUrl}</FieldError> : null}
            </TextField>

            <TextField isRequired isInvalid={!!errors.content} className="md:col-span-2">
              <Label className="text-text-muted">文章内容</Label>
              <Description>支持 Markdown 语法</Description>
              {previewMode === "write" ? (
                <TextArea
                  className="min-h-[420px] text-text-base"
                  rows={18}
                  value={formData.content}
                  onChange={(event) => updateField("content", event.target.value)}
                />
              ) : (
                <div className="min-h-[420px] rounded-md border border-border bg-background p-4">
                  <ArticleMarkdown content={formData.content} />
                </div>
              )}
              {errors.content ? <FieldError>{errors.content}</FieldError> : null}
            </TextField>
          </div>

          <div className="flex items-center gap-2">
            <Switch isSelected={formData.featured} onChange={(value) => updateField("featured", value)}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <span className="text-sm">置顶文章</span>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">文章标签</label>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) =>
                tag.id ? (
                  <Chip
                    key={tag.id}
                    variant={selectedTagIds.has(tag.id) ? "primary" : "secondary"}
                    color={selectedTagIds.has(tag.id) ? "accent" : "default"}
                    className="cursor-pointer"
                    onClick={() => handleTagSelect(tag as Tag)}
                  >
                    <Chip.Label>{tag.name}</Chip.Label>
                  </Chip>
                ) : null,
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="text-text-base max-w-xs"
                placeholder="输入新标签"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
              />
              <Button size="sm" variant="secondary" onPress={handleAddNewTag}>
                添加
              </Button>
            </div>

            {formData.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-text-base">已选择标签:</span>
                {formData.tags.map((tag) => (
                  <Chip key={tag.id} variant="soft" color="accent" size="sm">
                    <Chip.Label>{tag.name}</Chip.Label>
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        </Card.Content>

        <div className="flex flex-wrap justify-end gap-3 border-t p-4">
          {onCancel ? (
            <Button variant="ghost" onPress={onCancel} isDisabled={loading}>
              取消
            </Button>
          ) : null}
          <Button type="button" variant="secondary" isDisabled={loading} onPress={() => void handleSubmit("DRAFT")}>
            保存草稿
          </Button>
          <Button type="submit" variant="primary" isDisabled={loading} isPending={loading}>
            {submitText}
          </Button>
        </div>
      </Form>
    </Card>
  );
}

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
  InputGroup,
  useOverlayState,
} from "@heroui/react";
import { Category, Post, PostStatus, Tag } from "@/generated/prisma";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { request, type HttpError } from "@/lib/request";
import { normalizeSlug } from "@/lib/slug";
import { StringSelect } from "@/components/admin/string-select";
import { ArticleMarkdownClient } from "@/components/post/article-markdown";
import { PostCategoryPicker, type FormCategory } from "@/components/post/post-category-picker";
import { PostCoverManager, type CoverPreviewItem } from "@/components/post/post-cover-manager";
import { PostTagPicker, type FormTag } from "@/components/post/post-tag-picker";
import { nowPublishedAtValue, PublishedAtPicker } from "@/components/post/published-at-picker";
import { MediaPickerModal } from "@/components/admin/media/media-picker-modal";
import { ImageUploader, type UploadedMedia } from "@/components/ui/image-uploader";
import { ExternalMediaInput } from "@/components/ui/external-media-input";

type CoverMediaRelation = {
  sortOrder: number;
  mediaFile: {
    id: string;
    url: string;
  };
};

interface PostDetail extends Post {
  tags: Tag[];
  category: Category | null;
  coverMedia?: CoverMediaRelation[];
  contentMedia?: Array<{
    mediaFile: {
      id: string;
      url: string;
    };
  }>;
}

type PostFormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  category: FormCategory | null;
  featured: boolean;
  tags: FormTag[];
  coverItems: CoverPreviewItem[];
  contentMediaFileIds: string[];
  publishedAt: string;
};

type FormErrors = Partial<Record<"title" | "slug" | "content" | "excerpt" | "publishedAt" | "category", string>>;

const emptyFormData: PostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "DRAFT",
  category: null,
  featured: false,
  tags: [],
  coverItems: [],
  contentMediaFileIds: [],
  publishedAt: "",
};

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
    category: article.category
      ? {
          id: article.category.id,
          name: article.category.name,
          slug: article.category.slug,
        }
      : null,
    featured: article.featured || false,
    tags: article.tags || [],
    coverItems: (article.coverMedia ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.mediaFile.id,
        url: item.mediaFile.url,
      })),
    contentMediaFileIds: (article.contentMedia ?? []).map((item) => item.mediaFile.id),
    publishedAt: article.publishedAt ? toDatetimeLocalValue(new Date(article.publishedAt)) : "",
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

function validateForm(formData: PostFormData, categories: Partial<Category>[]): FormErrors {
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
  if (
    formData.category &&
    !formData.category.isNew &&
    !formData.category.id.startsWith("temp-cat-") &&
    categories.length > 0 &&
    !categories.some((category) => category.id === formData.category?.id)
  ) {
    errors.category = "所选分类不存在，请重新选择";
  }
  if (formData.status === "PUBLISHED") {
    if (!formData.publishedAt.trim()) {
      errors.publishedAt = "发布日期不能为空";
    } else if (Number.isNaN(new Date(formData.publishedAt).getTime())) {
      errors.publishedAt = "发布日期格式不正确";
    }
  }

  return errors;
}

function sanitizeCategory(
  category: FormCategory | null | undefined,
  categories: Partial<Category>[],
): FormCategory | null {
  if (!category) return null;
  if (category.isNew || category.id.startsWith("temp-cat-")) return category;
  if (categories.length === 0) return category;
  const exists = categories.some((item) => item.id === category.id);
  return exists ? category : null;
}

export function PostForm({
  article,
  categories = [],
  tags = [],
  className,
  onSubmit,
  onCancel,
}: {
  article?: PostDetail;
  categories?: Partial<Category>[];
  tags?: Partial<Tag>[];
  className?: string;
  onSubmit?: (article: Partial<Post>) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const baseline = useMemo(() => formDataFromArticle(article), [article]);
  const draftKey = `admin-post-draft:${article?.id ?? "create"}`;

  const [formData, setFormData] = useState<PostFormData>(baseline);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [generatingExcerpt, setGeneratingExcerpt] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [previewMode, setPreviewMode] = useState<"write" | "preview">("write");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const mediaPicker = useOverlayState();

  useEffect(() => {
    if (article?.id) return;

    const timer = window.setTimeout(() => {
      const draft = readLocalDraft(article?.id, draftKey);
      if (!draft) return;
      setFormData({
        ...draft,
        category: sanitizeCategory(draft.category, categories),
      });
      setLastSavedAt("已恢复本地草稿");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [article?.id, categories, draftKey]);

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
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "status" && value === "PUBLISHED" && !next.publishedAt.trim()) {
        next.publishedAt = nowPublishedAtValue();
      }
      return next;
    });
    if (
      key === "title" ||
      key === "slug" ||
      key === "content" ||
      key === "excerpt" ||
      key === "publishedAt"
    ) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleTagChange(tags: FormTag[]) {
    setFormData((prev) => ({ ...prev, tags }));
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

  function insertContentImage(media: UploadedMedia, altText?: string) {
    const alt = altText?.trim() || "image";
    const snippet = `\n![${alt}](${media.url})\n`;
    const textarea = contentRef.current;

    if (textarea) {
      const start = textarea.selectionStart ?? formData.content.length;
      const end = textarea.selectionEnd ?? start;
      const nextContent = `${formData.content.slice(0, start)}${snippet}${formData.content.slice(end)}`;
      updateField("content", nextContent);
      window.requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + snippet.length;
        textarea.setSelectionRange(cursor, cursor);
      });
    } else {
      updateField("content", `${formData.content}${snippet}`);
    }

    setFormData((prev) => ({
      ...prev,
      contentMediaFileIds: prev.contentMediaFileIds.includes(media.id)
        ? prev.contentMediaFileIds
        : [...prev.contentMediaFileIds, media.id],
    }));
  }

  async function handleSubmit(statusOverride?: PostStatus) {
    const nextStatus = statusOverride ?? formData.status;
    const nextFormData = {
      ...formData,
      slug: normalizeSlug(formData.slug),
      status: nextStatus,
      publishedAt:
        nextStatus === "PUBLISHED" && !formData.publishedAt.trim()
          ? nowPublishedAtValue()
          : formData.publishedAt,
    };
    const validationErrors = validateForm(nextFormData, categories);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast(`表单校验未通过：${Object.values(validationErrors).join("，")}`);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const {
        publishedAt: publishedAtLocal,
        coverItems,
        contentMediaFileIds,
        category,
        ...restFormData
      } = nextFormData;
      const isNewCategory = category?.isNew || category?.id.startsWith("temp-cat-");
      const submitData = {
        ...restFormData,
        coverMediaFileIds: coverItems.map((item) => item.id),
        contentMediaFileIds,
        excerpt: nextFormData.excerpt.trim() || createExcerptFromContent(nextFormData.content),
        ...(category
          ? isNewCategory
            ? {
                category: {
                  name: category.name,
                  slug: normalizeSlug(category.slug || category.name, 100),
                },
              }
            : { categoryId: category.id }
          : {}),
        tags: nextFormData.tags.map((tag) => ({
          id: tag.id.startsWith("temp-") ? undefined : tag.id,
          name: tag.name,
          slug: normalizeSlug(tag.slug || tag.name, 50),
        })),
        ...(nextFormData.status === "PUBLISHED" && publishedAtLocal.trim()
          ? { publishedAt: new Date(publishedAtLocal).toISOString() }
          : {}),
      };

      if (onSubmit) {
        const { publishedAt: publishedAtIso, ...rest } = submitData;
        onSubmit({
          ...rest,
          ...(publishedAtIso ? { publishedAt: new Date(publishedAtIso) } : {}),
        });
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

  const charCount = formData.content.replace(/\s/g, "").length;
  const readMinutes = Math.max(1, Math.ceil(charCount / 500));
  const statusLabel =
    formData.status === "PUBLISHED" ? "已发布" : formData.status === "ARCHIVED" ? "已归档" : "草稿";
  const submitText = loading
    ? "提交中..."
    : article?.id
      ? "更新文章"
      : formData.status === "PUBLISHED"
        ? "发布文章"
        : "保存文章";

  return (
    <div className={`mx-auto flex w-full flex-col ${className ?? ""}`}>
      <Card className="sticky top-4 z-10 mb-3 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-sm backdrop-blur-sm">
        <Card.Content className="px-2">
          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-text-base sm:text-2xl">
                  {article?.id ? "编辑文章" : "创建文章"}
                </h1>
                <Chip variant="soft" size="sm" color={formData.status === "PUBLISHED" ? "success" : "default"}>
                  <Chip.Label>{statusLabel}</Chip.Label>
                </Chip>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span>{charCount} 字</span>
                <span aria-hidden="true">·</span>
                <span>约 {readMinutes} 分钟阅读</span>
                {lastSavedAt ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{lastSavedAt}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {onCancel ? (
                <Button variant="ghost" onPress={onCancel} isDisabled={loading}>
                  取消
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                isDisabled={loading}
                onPress={() => void handleSubmit("DRAFT")}
              >
                保存草稿
              </Button>
              <Button
                type="button"
                variant="primary"
                isDisabled={loading}
                isPending={loading}
                onPress={() => void handleSubmit()}
              >
                {submitText}
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <Card className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              <Card.Content className="space-y-4 p-5 sm:p-6">
                <TextField isRequired isInvalid={!!errors.title}>
                  <Label className="sr-only">文章标题</Label>
                  <Input
                    className="border-none bg-transparent px-0 text-2xl font-semibold text-text-base shadow-none placeholder:text-text-sub sm:text-3xl"
                    placeholder="输入文章标题…"
                    value={formData.title}
                    onChange={(event) => updateField("title", event.target.value)}
                  />
                  {errors.title ? <FieldError>{errors.title}</FieldError> : null}
                </TextField>

                <TextField isRequired isInvalid={!!errors.slug}>
                  <Label className="text-sm text-text-muted">Slug</Label>
                  <Description className="text-xs">用于生成文章 URL</Description>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <InputGroup
                      className="flex-1 font-mono text-sm text-text-base"
                    >
                      <InputGroup.Input
                        value={formData.slug}
                        onBlur={() => updateField("slug", normalizeSlug(formData.slug))}
                        onChange={(event) => updateField("slug", event.target.value)}
                        placeholder="article-slug"
                      />
                      <InputGroup.Suffix className="p-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={handleGenerateSlug}
                          isDisabled={loading || generatingSlug}
                          isPending={generatingSlug}
                        >
                          {generatingSlug ? "生成中…" : "AI 生成"}
                        </Button>
                      </InputGroup.Suffix>
                    </InputGroup>
                  </div>
                  {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
                </TextField>
              </Card.Content>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              <Card.Header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <Label className="text-sm font-medium text-text-base">正文</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {previewMode === "write" ? (
                    <>
                      <ImageUploader
                        category="images"
                        label="上传插图"
                        disabled={loading}
                        onUploaded={(media) => insertContentImage(media)}
                      />
                      <ExternalMediaInput
                        category="images"
                        label="插入外链"
                        disabled={loading}
                        onRegistered={(media) => insertContentImage(media)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        isDisabled={loading}
                        onPress={mediaPicker.open}
                      >
                        媒体库
                      </Button>
                    </>
                  ) : null}
                  <Tabs
                    className="w-full sm:w-[168px]"
                    selectedKey={previewMode}
                    onSelectionChange={(key) =>
                      setPreviewMode(String(key) === "preview" ? "preview" : "write")
                    }
                  >
                    <Tabs.ListContainer>
                      <Tabs.List aria-label="正文编辑模式">
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

              <Card.Content className="p-0">
                <TextField isRequired isInvalid={!!errors.content}>
                  <Label className="sr-only">文章内容</Label>
                  {previewMode === "write" ? (
                    <TextArea
                      ref={contentRef}
                      className="min-h-[min(70vh,640px)] w-full resize-y rounded-none border-0 bg-transparent px-4 py-4 font-mono text-sm leading-relaxed text-text-base shadow-none sm:px-5"
                      placeholder="在此编写 Markdown 正文…"
                      rows={24}
                      value={formData.content}
                      onChange={(event) => updateField("content", event.target.value)}
                    />
                  ) : (
                    <div className="min-h-[min(70vh,640px)] overflow-auto px-4 py-4 sm:px-5">
                      {formData.content.trim() ? (
                        <ArticleMarkdownClient content={formData.content} />
                      ) : (
                        <p className="py-12 text-center text-sm text-text-muted">暂无内容，切换至编辑模式开始写作</p>
                      )}
                    </div>
                  )}
                  {errors.content ? (
                    <div className="border-t border-border px-4 py-2 sm:px-5">
                      <FieldError>{errors.content}</FieldError>
                    </div>
                  ) : null}
                </TextField>
              </Card.Content>
            </Card>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card className="rounded-2xl border border-border bg-background shadow-sm">
              <Card.Header className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-text-base">发布设置</h2>
              </Card.Header>
              <Card.Content className="space-y-4 p-4">
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

                <PostCategoryPicker
                  categories={categories}
                  value={formData.category}
                  onChange={(category) => setFormData((prev) => ({ ...prev, category }))}
                  disabled={loading}
                  isInvalid={!!errors.category}
                  errorMessage={errors.category}
                />

                {formData.status === "PUBLISHED" ? (
                  <PublishedAtPicker
                    value={formData.publishedAt}
                    onChange={(value) => updateField("publishedAt", value)}
                    isInvalid={!!errors.publishedAt}
                    errorMessage={errors.publishedAt}
                  />
                ) : null}

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-3 py-2.5">
                  <span className="text-sm text-text-base">置顶文章</span>
                  <Switch
                    isSelected={formData.featured}
                    onChange={(value) => updateField("featured", value)}
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>
              </Card.Content>
            </Card>

            <Card className="rounded-2xl border border-border bg-background shadow-sm">
              <Card.Header className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-text-base">封面</h2>
              </Card.Header>
              <Card.Content className="p-4">
                <PostCoverManager
                  items={formData.coverItems}
                  disabled={loading}
                  onChange={(items) => updateField("coverItems", items)}
                />
              </Card.Content>
            </Card>

            <Card className="rounded-2xl border border-border bg-background shadow-sm">
              <Card.Header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-text-base">摘要</h2>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={handleGenerateExcerpt}
                  isDisabled={loading || generatingExcerpt}
                  isPending={generatingExcerpt}
                >
                  {generatingExcerpt ? "生成中…" : "AI 生成"}
                </Button>
              </Card.Header>
              <Card.Content className="p-4">
                <TextField isInvalid={!!errors.excerpt}>
                  <Description className="mb-2 text-xs">留空提交时会根据正文自动截取</Description>
                  <TextArea
                    className="text-sm text-text-base"
                    rows={3}
                    placeholder="简短描述文章内容…"
                    value={formData.excerpt}
                    onChange={(event) => updateField("excerpt", event.target.value)}
                  />
                  {errors.excerpt ? <FieldError>{errors.excerpt}</FieldError> : null}
                </TextField>
              </Card.Content>
            </Card>

            <Card className="rounded-2xl border border-border bg-background shadow-sm">
              <Card.Content className="p-4">
                <PostTagPicker
                  catalogTags={tags}
                  value={formData.tags}
                  onChange={handleTagChange}
                  disabled={loading}
                />
              </Card.Content>
            </Card>
          </aside>
        </div>
      </Form>

      <MediaPickerModal
        state={mediaPicker}
        title="选择正文插图"
        uploadCategory="images"
        initialCategoryFilter="CONTENT"
        onSelect={(media) => insertContentImage(media)}
      />
    </div>
  );
}

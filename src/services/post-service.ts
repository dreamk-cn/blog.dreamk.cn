import { Prisma } from "@prisma/client";
import { contentConfig } from "@/config/content";
import { getDeepseekClient } from "@/lib/ai-client";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slug";

type PostTagInput = { id?: string; name?: string; slug?: string };

const deepseekSlugModel =
  process.env.DEEPSEEK_SLUG_MODEL ??
  process.env.DEEPSEEK_EXCERPT_MODEL ??
  "deepseek-v4-flash";

const deepseekExcerptModel = process.env.DEEPSEEK_EXCERPT_MODEL ?? "deepseek-v4-flash";

const publicPostOrderBy: Prisma.PostOrderByWithRelationInput[] = [{ publishedAt: "desc" }, { createdAt: "desc" }];

function toTagConnectOrCreate(tags: PostTagInput[]): Prisma.TagCreateOrConnectWithoutPostsInput[] {
  return tags.map((tag) => {
    const normalizedSlug = normalizeSlug(tag.slug || tag.name || "", 50);
    const tagName = tag.name || normalizedSlug || "untitled-tag";

    return {
      where: tag.id ? { id: tag.id } : { slug: normalizedSlug },
      create: {
        name: tagName,
        slug: normalizedSlug || tagName,
      },
    };
  });
}

function cleanGeneratedSlug(text: string) {
  const line = text.split(/\r?\n/)[0] ?? "";
  return normalizeSlug(line);
}

function cleanGeneratedExcerpt(text: string) {
  return text
    .replace(/^["'`\s]+|["'`\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function buildPublicPostWhere(keyword?: string): Prisma.PostWhereInput {
  const normalizedKeyword = keyword?.trim() ?? "";

  return {
    status: "PUBLISHED",
    slug: {
      notIn: [...contentConfig.excludedPostSlugsForPublicFeed],
    },
    ...(normalizedKeyword
      ? {
          OR: [
            { title: { contains: normalizedKeyword, mode: "insensitive" } },
            { excerpt: { contains: normalizedKeyword, mode: "insensitive" } },
            { content: { contains: normalizedKeyword, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function listRecentPublicPosts(limit: number) {
  return prisma.post.findMany({
    include: {
      tags: true,
    },
    where: buildPublicPostWhere(),
    orderBy: {
      publishedAt: "desc",
    },
    take: limit,
  });
}

export async function listHotPublicPosts(limit: number) {
  return prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
    },
    where: buildPublicPostWhere(),
    orderBy: {
      viewCount: "desc",
    },
    take: limit,
  });
}

export async function listPublicPostsPage(params: { page: number; pageSize: number; keyword?: string }) {
  const safePage = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const where = buildPublicPostWhere(params.keyword);
  const total = await prisma.post.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const skip = (currentPage - 1) * params.pageSize;

  const posts = await prisma.post.findMany({
    include: {
      tags: true,
    },
    where,
    orderBy: publicPostOrderBy,
    skip,
    take: params.pageSize,
  });

  return {
    posts,
    total,
    totalPages,
    currentPage,
  };
}

export async function getPublishedPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      tags: true,
      category: true,
      user: { select: { name: true } },
    },
  });
}

export async function getPublishedPostMetadataBySlug(slug: string) {
  return prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      excerpt: true,
    },
  });
}

export async function getPostDetail(params: { id?: string; slug?: string; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; isAdmin: boolean }) {
  const { id, slug, status, isAdmin } = params;
  const queryKey = (id ? "id" : "slug") as "id" | "slug";
  const queryValue = (id || slug) as string;

  const query: Parameters<typeof prisma.post.findFirst>[0] = {
    where: {
      [queryKey]: queryValue,
      ...(!isAdmin
        ? { status: "PUBLISHED" }
        : status
          ? { status }
          : {}),
    },
    include: {
      tags: true,
      category: true,
    },
  };

  return prisma.post.findFirst(query);
}

export async function listPosts(params: {
  pageNo: number;
  pageSize: number;
  keyword?: string;
  sortBy: "createdAt" | "updatedAt" | "title" | "content";
  sortOrder: "asc" | "desc";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isAdmin: boolean;
}) {
  const { pageNo, pageSize, keyword, sortBy, sortOrder, status, isAdmin } = params;
  const query: Parameters<typeof prisma.post.findMany>[0] = {
    include: {
      category: true,
      tags: true,
    },
    where: {
      ...(!isAdmin
        ? { status: "PUBLISHED" }
        : status
          ? { status }
          : {}),
      ...(isAdmin
        ? {}
        : {
            slug: {
              notIn: [...contentConfig.excludedPostSlugsForPublicFeed],
            },
          }),
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (pageNo - 1) * pageSize,
    take: pageSize,
  };

  if (keyword) {
    query.where = {
      ...query.where,
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { content: { contains: keyword, mode: "insensitive" } },
      ],
    };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany(query),
    prisma.post.count({ where: query.where }),
  ]);
  return { posts, total };
}

export async function createPost(input: {
  userId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  coverUrl?: string;
  categoryId?: string;
  tags: PostTagInput[];
}) {
  const { userId, title, slug, content, excerpt, status, featured, coverUrl, categoryId, tags } = input;

  return prisma.post.create({
    data: {
      title,
      slug,
      status,
      content,
      excerpt,
      featured,
      coverUrl,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      user: { connect: { id: userId } },
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      ...(tags.length > 0 ? { tags: { connectOrCreate: toTagConnectOrCreate(tags) } } : {}),
    },
  });
}

export async function updatePost(input: {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  coverUrl?: string;
  categoryId?: string;
  tags: PostTagInput[];
}) {
  const { id, title, slug, content, excerpt, status, featured, coverUrl, categoryId, tags } = input;
  const existingPost = await prisma.post.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!existingPost) return null;

  const shouldSetPublishedAt = status === "PUBLISHED" && !existingPost.publishedAt;

  return prisma.post.update({
    where: { id },
    data: {
      title,
      slug,
      content,
      excerpt,
      status,
      featured,
      coverUrl,
      ...(status === "PUBLISHED"
        ? { publishedAt: shouldSetPublishedAt ? new Date() : existingPost.publishedAt }
        : { publishedAt: null }),
      categoryId,
      tags: {
        disconnect: existingPost.tags.map((tag) => ({ id: tag.id })),
        connectOrCreate: toTagConnectOrCreate(tags),
      },
    },
    include: {
      tags: true,
      category: true,
    },
  });
}

export async function deletePosts(ids: string[]) {
  return prisma.post.deleteMany({
    where: {
      id: { in: ids },
    },
  });
}

export async function incrementPostView(slug: string) {
  return prisma.post.updateMany({
    where: {
      slug,
      status: "PUBLISHED",
    },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}

export async function generatePostSlug(input: { title: string; content?: string }) {
  const client = getDeepseekClient();
  if (!client) {
    return { error: "未配置 DEEPSEEK_API_KEY" as const };
  }

  const prompt = [
    "你是网站路由与 SEO 助手，需要根据博客文章信息生成 URL 路径中的一段 slug（英文小写、连字符风格）。",
    "要求：",
    "1) 只输出一行 slug 文本，不要引号、解释、Markdown、前后空白。",
    "2) 仅使用小写英文字母 a-z、数字 0-9、连字符 -；不要用下划线或空格。",
    "3) 简洁有意义，能概括主题；长度建议 12–60 个字符。",
    "4) 若标题为中文或其他语言，请改写或意译为合适的英文短语作为 slug。",
    "5) 不要以连字符开头或结尾；不要连续多个连字符。",
  ].join("\n");

  const userParts = [`文章标题：\n${input.title}`];
  if (input.content?.trim()) {
    userParts.push(`正文节选（供参考，可忽略与 slug 无关内容）：\n${input.content.trim().slice(0, 8000)}`);
  }

  const result = await client.chat.completions.create({
    model: deepseekSlugModel,
    temperature: 0.3,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: userParts.join("\n\n"),
      },
    ],
  });

  const raw = result.choices?.[0]?.message?.content ?? "";
  const slug = cleanGeneratedSlug(raw);
  if (!slug) {
    return { error: "未生成有效 slug，请重试或手动填写" as const };
  }

  return { data: { slug } };
}

export async function generatePostExcerpt(input: { content: string }) {
  const client = getDeepseekClient();
  if (!client) {
    return { error: "未配置 DEEPSEEK_API_KEY" as const };
  }

  const prompt = [
    "你是中文技术博客编辑助手。",
    "请根据输入的 Markdown 文章正文，生成一条简洁、自然、可读的中文文章摘要。",
    "要求：",
    "1) 只输出摘要正文，不要标题、引号、编号、解释。",
    "2) 长度控制在 80-160 个中文字符内。",
    "3) 不要包含 Markdown 语法符号。",
    "4) 语气中性，突出文章核心价值和结论。",
  ].join("\n");

  const result = await client.chat.completions.create({
    model: deepseekExcerptModel,
    temperature: 0.4,
    max_tokens: 220,
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: input.content.slice(0, 12000),
      },
    ],
  });

  const rawExcerpt = result.choices?.[0]?.message?.content ?? "";
  const excerpt = cleanGeneratedExcerpt(rawExcerpt);
  if (!excerpt) {
    return { error: "未生成有效摘要，请重试" as const };
  }

  return { data: { excerpt } };
}

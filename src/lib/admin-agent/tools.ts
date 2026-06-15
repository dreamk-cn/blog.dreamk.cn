import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { getDashboardStats } from '@/services/admin-dashboard-stats';
import { listCategories } from '@/services/category-service';
import { listComments } from '@/services/comment-service';
import { listFriendLinks } from '@/services/friend-link-service';
import { listMediaFiles } from '@/services/media-file-service';
import { getPostDetail, listPosts } from '@/services/post-service';
import { listTags } from '@/services/tag-service';
import { listUsers } from '@/services/user-service';
import { truncateJsonForLlm } from './truncate';
import { ADMIN_AGENT_TOOL_NAME } from './tool-labels';
import type { ToolExecutionResult } from './types';

const MAX_PAGE_SIZE = 20;

function clampPageSize(pageSize?: number) {
  const size = pageSize ?? 10;
  return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
}

function clampPageNo(pageNo?: number) {
  return Math.max(pageNo ?? 1, 1);
}

function excerptText(text: string | null | undefined, max = 200) {
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function summarizeList(total: number, pageNo: number, pageSize: number, label: string) {
  return `共 ${total} 条${label}，当前第 ${pageNo} 页（每页 ${pageSize} 条）`;
}

export const ADMIN_AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.GET_DASHBOARD_STATS,
      description: '获取后台仪表盘统计数据，包括文章、评论、用户、分类、标签、友链等汇总信息',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.LIST_POSTS,
      description: '分页查询文章列表（管理员视角，含草稿/已发布/已归档）',
      parameters: {
        type: 'object',
        properties: {
          pageNo: { type: 'integer', description: '页码，从 1 开始' },
          pageSize: { type: 'integer', description: '每页条数，最大 20' },
          keyword: { type: 'string', description: '搜索标题或正文关键词' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], description: '文章状态筛选' },
          sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'title', 'content'], description: '排序字段' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], description: '排序方向' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.GET_POST_DETAIL,
      description: '根据 id 或 slug 获取单篇文章详情',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '文章 ID' },
          slug: { type: 'string', description: '文章 slug' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], description: '状态筛选' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.LIST_COMMENTS,
      description: '分页查询评论列表',
      parameters: {
        type: 'object',
        properties: {
          pageNo: { type: 'integer' },
          pageSize: { type: 'integer', description: '最大 20' },
          keyword: { type: 'string', description: '搜索评论内容、文章标题或用户名' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'SPAM', 'DELETED'], description: '评论状态' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.LIST_USERS,
      description: '查询用户列表',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索用户名或邮箱' },
          status: { type: 'string', enum: ['BAN', 'VALID', 'DELETED'], description: '用户状态' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.LIST_CATEGORIES,
      description: '查询分类列表',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索分类名称或 slug' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.LIST_TAGS,
      description: '查询标签列表',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索标签名称或 slug' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.LIST_FRIEND_LINKS,
      description: '查询友链列表',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索名称或 URL' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'], description: '友链状态' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: ADMIN_AGENT_TOOL_NAME.LIST_MEDIA_FILES,
      description: '分页查询媒体文件列表',
      parameters: {
        type: 'object',
        properties: {
          pageNo: { type: 'integer' },
          pageSize: { type: 'integer', description: '最大 20' },
          keyword: { type: 'string', description: '搜索文件名' },
          category: { type: 'string', enum: ['ALL', 'ASSET', 'COVER', 'CONTENT'], description: '媒体分类' },
          source: { type: 'string', enum: ['ALL', 'UPLOAD', 'EXTERNAL'], description: '来源' },
          sortBy: { type: 'string', enum: ['createdAt', 'size'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
        additionalProperties: false,
      },
    },
  },
];

type ListPostsArgs = {
  pageNo?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'content';
  sortOrder?: 'asc' | 'desc';
};

type GetPostDetailArgs = {
  id?: string;
  slug?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

type ListCommentsArgs = {
  pageNo?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'PENDING' | 'APPROVED' | 'SPAM' | 'DELETED';
  sortOrder?: 'asc' | 'desc';
};

type ListUsersArgs = {
  keyword?: string;
  status?: 'BAN' | 'VALID' | 'DELETED';
};

type ListFriendLinksArgs = {
  keyword?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
};

type ListMediaFilesArgs = {
  pageNo?: number;
  pageSize?: number;
  keyword?: string;
  category?: 'ALL' | 'ASSET' | 'COVER' | 'CONTENT';
  source?: 'ALL' | 'UPLOAD' | 'EXTERNAL';
  sortBy?: 'createdAt' | 'size';
  sortOrder?: 'asc' | 'desc';
};

export async function executeTool(name: string, args: unknown): Promise<ToolExecutionResult> {
  try {
    switch (name) {
      case ADMIN_AGENT_TOOL_NAME.GET_DASHBOARD_STATS: {
        const stats = await getDashboardStats();
        return {
          content: truncateJsonForLlm(stats),
          summary: `已获取仪表盘统计`,
        };
      }
      case ADMIN_AGENT_TOOL_NAME.LIST_POSTS: {
        const input = (args ?? {}) as ListPostsArgs;
        const pageNo = clampPageNo(input.pageNo);
        const pageSize = clampPageSize(input.pageSize);
        const { posts, total } = await listPosts({
          pageNo,
          pageSize,
          keyword: input.keyword,
          sortBy: input.sortBy ?? 'createdAt',
          sortOrder: input.sortOrder ?? 'desc',
          status: input.status,
          isAdmin: true,
        });
        const payload = {
          total,
          pageNo,
          pageSize,
          posts: posts.map((post) => {
            const row = post as typeof post & {
              category?: { id: string; name: string; slug: string } | null;
              tags?: Array<{ id: string; name: string; slug: string }>;
            };
            return {
              id: row.id,
              title: row.title,
              slug: row.slug,
              status: row.status,
              featured: row.featured,
              viewCount: row.viewCount,
              excerpt: excerptText(row.excerpt, 120),
              category: row.category
                ? { id: row.category.id, name: row.category.name, slug: row.category.slug }
                : null,
              tags: (row.tags ?? []).map((tag) => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
              })),
              publishedAt: row.publishedAt,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            };
          }),
        };
        return {
          content: truncateJsonForLlm(payload),
          summary: summarizeList(total, pageNo, pageSize, '文章'),
        };
      }
      case ADMIN_AGENT_TOOL_NAME.GET_POST_DETAIL: {
        const input = (args ?? {}) as GetPostDetailArgs;
        if (!input.id && !input.slug) {
          return { content: JSON.stringify({ error: '请提供 id 或 slug' }) };
        }
        const post = await getPostDetail({
          id: input.id,
          slug: input.slug,
          status: input.status,
          isAdmin: true,
        });
        if (!post) {
          return { content: JSON.stringify({ error: '未找到文章' }), summary: '文章不存在' };
        }
        const payload = {
          ...post,
          content: excerptText(post.content, 4000),
          excerpt: excerptText(post.excerpt, 500),
        };
        return {
          content: truncateJsonForLlm(payload),
          summary: `已获取文章「${post.title}」`,
        };
      }
      case ADMIN_AGENT_TOOL_NAME.LIST_COMMENTS: {
        const input = (args ?? {}) as ListCommentsArgs;
        const pageNo = clampPageNo(input.pageNo);
        const pageSize = clampPageSize(input.pageSize);
        const { comments, total } = await listComments({
          pageNo,
          pageSize,
          keyword: input.keyword,
          sortOrder: input.sortOrder ?? 'desc',
          status: input.status,
        });
        const payload = {
          total,
          pageNo,
          pageSize,
          comments: comments.map((comment) => ({
            id: comment.id,
            content: excerptText(comment.content, 300),
            status: comment.status,
            post: comment.post,
            user: comment.user
              ? { id: comment.user.id, name: comment.user.name, email: comment.user.email }
              : null,
            parentId: comment.parentId,
            createdAt: comment.createdAt,
          })),
        };
        return {
          content: truncateJsonForLlm(payload),
          summary: summarizeList(total, pageNo, pageSize, '评论'),
        };
      }
      case ADMIN_AGENT_TOOL_NAME.LIST_USERS: {
        const input = (args ?? {}) as ListUsersArgs;
        const users = await listUsers({
          keyword: input.keyword,
          status: input.status,
        });
        const payload = {
          total: users.length,
          users: users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
          })),
        };
        return {
          content: truncateJsonForLlm(payload),
          summary: `已获取 ${users.length} 个用户`,
        };
      }
      case ADMIN_AGENT_TOOL_NAME.LIST_CATEGORIES: {
        const input = (args ?? {}) as { keyword?: string };
        const categories = await listCategories(input.keyword ?? '');
        const payload = {
          total: categories.length,
          categories: categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt,
          })),
        };
        return {
          content: truncateJsonForLlm(payload),
          summary: `已获取 ${categories.length} 个分类`,
        };
      }
      case ADMIN_AGENT_TOOL_NAME.LIST_TAGS: {
        const input = (args ?? {}) as { keyword?: string };
        const tags = await listTags(input.keyword ?? '');
        const payload = {
          total: tags.length,
          tags: tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            createdAt: tag.createdAt,
          })),
        };
        return {
          content: truncateJsonForLlm(payload),
          summary: `已获取 ${tags.length} 个标签`,
        };
      }
      case ADMIN_AGENT_TOOL_NAME.LIST_FRIEND_LINKS: {
        const input = (args ?? {}) as ListFriendLinksArgs;
        const links = await listFriendLinks({
          keyword: input.keyword,
          status: input.status,
        });
        const payload = {
          total: links.length,
          friendLinks: links.map((link) => ({
            id: link.id,
            name: link.name,
            url: link.url,
            status: link.status,
            sortOrder: link.sortOrder,
            description: excerptText(link.description, 200),
            createdAt: link.createdAt,
          })),
        };
        return {
          content: truncateJsonForLlm(payload),
          summary: `已获取 ${links.length} 条友链`,
        };
      }
      case ADMIN_AGENT_TOOL_NAME.LIST_MEDIA_FILES: {
        const input = (args ?? {}) as ListMediaFilesArgs;
        const pageNo = clampPageNo(input.pageNo);
        const pageSize = clampPageSize(input.pageSize);
        const { list, total } = await listMediaFiles({
          pageNo,
          pageSize,
          keyword: input.keyword,
          category: input.category ?? 'ALL',
          source: input.source ?? 'ALL',
          sortBy: input.sortBy ?? 'createdAt',
          sortOrder: input.sortOrder ?? 'desc',
        });
        const payload = { total, pageNo, pageSize, mediaFiles: list };
        return {
          content: truncateJsonForLlm(payload),
          summary: summarizeList(total, pageNo, pageSize, '媒体文件'),
        };
      }
      default:
        return { content: JSON.stringify({ error: `未知工具: ${name}` }) };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '工具执行失败';
    return { content: JSON.stringify({ error: message }), summary: '执行失败' };
  }
}

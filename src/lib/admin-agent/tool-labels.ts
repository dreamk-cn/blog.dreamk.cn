/** Agent 只读 tool 名称（与 OpenAI tools 定义、executeTool 分发保持一致） */
export const ADMIN_AGENT_TOOL_NAME = {
  GET_DASHBOARD_STATS: 'get_dashboard_stats',
  LIST_POSTS: 'list_posts',
  GET_POST_DETAIL: 'get_post_detail',
  LIST_COMMENTS: 'list_comments',
  LIST_USERS: 'list_users',
  LIST_CATEGORIES: 'list_categories',
  LIST_TAGS: 'list_tags',
  LIST_FRIEND_LINKS: 'list_friend_links',
  LIST_MEDIA_FILES: 'list_media_files',
} as const;

export type AdminAgentToolName =
  (typeof ADMIN_AGENT_TOOL_NAME)[keyof typeof ADMIN_AGENT_TOOL_NAME];

const ADMIN_AGENT_TOOL_LABELS: Record<AdminAgentToolName, string> = {
  [ADMIN_AGENT_TOOL_NAME.GET_DASHBOARD_STATS]: '仪表盘统计',
  [ADMIN_AGENT_TOOL_NAME.LIST_POSTS]: '文章列表',
  [ADMIN_AGENT_TOOL_NAME.GET_POST_DETAIL]: '文章详情',
  [ADMIN_AGENT_TOOL_NAME.LIST_COMMENTS]: '评论列表',
  [ADMIN_AGENT_TOOL_NAME.LIST_USERS]: '用户列表',
  [ADMIN_AGENT_TOOL_NAME.LIST_CATEGORIES]: '分类列表',
  [ADMIN_AGENT_TOOL_NAME.LIST_TAGS]: '标签列表',
  [ADMIN_AGENT_TOOL_NAME.LIST_FRIEND_LINKS]: '友链列表',
  [ADMIN_AGENT_TOOL_NAME.LIST_MEDIA_FILES]: '媒体文件',
};

export function getAdminAgentToolLabel(tool: string) {
  return ADMIN_AGENT_TOOL_LABELS[tool as AdminAgentToolName] ?? tool;
}

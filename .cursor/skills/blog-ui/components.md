# UI 组件与目录地图

## 路由与布局

| 区域 | 路由组 | Layout | 说明 |
|------|--------|--------|------|
| 博客 | `src/app/(blog)/` | `layout.tsx` | Navbar + Footer，`bg-foreground` |
| 后台 | `src/app/(admin)/` | `layout.tsx` + `layout-shell.tsx` | 侧栏仪表盘 |
| 认证 | `src/app/auth/` | 根 layout | `signin-client`、`login-form` |
| 全局 | `src/app/layout.tsx` | — | 字体、`AppProviders`、SEO |

## `src/components` 结构

```
components/
├── layouts/
│   ├── blog/          # navbar, footer, profile-sidebar
│   └── admin/         # layout, sidebar, navbar（含 tv 样式）
├── post/              # 卡片、封面、TOC、评论、Markdown、表单
├── markdown/          # Markdown 图片 Lightbox（MarkdownImage、Provider）
├── auth/              # login-form, register-form
├── admin/             # 后台 UI：admin-list-layout、paginated-footer、string-select 等
├── buttons/           # login-button
├── ui/
│   └── heroui-client.tsx   # Server 可用的 Client* 导出
├── icons.tsx
└── theme-switcher.tsx
```

## 配置与样式入口

| 文件 | 作用 |
|------|------|
| `src/config/site.ts` | 站名、导航、GitHub、ICP |
| `src/config/fonts.ts` | `--font-en`、`--font-cn` |
| `src/styles/globals.css` | CSS 变量、Tailwind `@theme`、`article-md` 代码高亮 |
| `src/styles/heroui.css` | Toast 等 HeroUI 覆盖 |
| `tailwind.config.ts` | `content` 路径、`darkMode: 'class'` |
| `src/app/providers.tsx` | Theme、Session、Toast、TopLoader |

## 博客页面示例

| 页面 | 路径 |
|------|------|
| 首页 | `src/app/(blog)/page.tsx` |
| 文章列表 | `src/app/(blog)/posts/` |
| 文章详情 | `src/app/(blog)/posts/[slug]/page.tsx` |
| 分类 | `src/app/(blog)/categories/` |
| 关于 | `src/app/(blog)/about/page.tsx` |

## 后台页面示例

| 功能 | 路径 |
|------|------|
| 仪表盘 | `admin/dashboard/` |
| 文章 CRUD | `admin/post/list`, `admin/post/create` |
| 分类/标签/评论/友链/用户 | `admin/*/list` |
| 缓存 | `admin/cache/` |

## 后台专用组件

| 组件 | 路径 | 用途 |
|------|------|------|
| `AdminListLayout` 等 | `src/components/admin/admin-list-layout.tsx` | 列表页 flex 布局；`AdminListTable` 固定表头 + 表体滚动 |
| `PaginatedFooter` | `src/components/admin/paginated-footer.tsx` | 列表底部分页与每页条数 |
| `StringSelect` | `src/components/admin/string-select.tsx` | 后台筛选下拉 |

## HeroUI 常用组件（本项目已出现）

`Button`, `Card`, `Chip`, `Avatar`, `Dropdown`, `SearchField`, `Input`, `TextField`, `Label`, `Table`, `Pagination`, `Spinner`, `Alert`, `Link`, `Separator`, `Modal`, `Toast`（Provider 在根级）

新增组件前用 MCP `list_components` / `get_component_docs` 确认 v3 API（复合子组件名可能与 v2 不同）。

## 评论与公开内容

| 模块 | 路径 |
|------|------|
| Markdown 图片 Lightbox | `src/components/markdown/` — `MarkdownImage`、`MarkdownImageLightboxProvider` |
| 最近留言 | `src/components/post/recent-comments.tsx` |
| 评论深链 | `src/components/post/comment/use-comment-deep-link.ts` |
| 公开缓存常量 | `src/lib/public-cache.ts`（读侧 TTL、写后 tag 失效） |

## 与 UI 相关的 hooks

| Hook | 路径 |
|------|------|
| `useMounted` | `src/hooks/useMounted.ts` — 主题切换 hydration |
| `useDebounce` | `src/hooks/useDebounce.ts` — 后台列表筛选 |
| `useLockedBody` | `components/hooks/useBodyLock.ts` — 移动侧栏滚动锁 |

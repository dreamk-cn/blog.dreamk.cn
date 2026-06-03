---
name: blog-ui
description: >-
  Builds and updates UI for blog.dreamk.cn (Dreamk 个人博客): HeroUI v3, Tailwind v4,
  blog front-end and admin dashboard. Use when adding or changing pages, components,
  layouts, styling, forms, tables, navigation, theme, or any visual/interaction work
  under src/app or src/components.
---

# blog.dreamk.cn UI

## 开始前

1. 判断改动属于 **博客前台** `(blog)` 还是 **管理后台** `(admin)`，沿用对应布局与密度。
2. 读 1–2 个同类现有组件（见 [components.md](components.md)），复制结构与 class 命名，不引入第二套 UI 库。
3. 需要 HeroUI v3 API 时，用 MCP `user-heroui-react`：`get_component_docs` → 再写代码。勿用 v2 文档。

与路由、数据、API 相关的约定见 `.cursor/rules/react-next-app-router.mdc` 等；本 skill 只约束视觉与交互。

## 技术栈（固定）

| 层 | 选型 |
|----|------|
| 框架 | Next.js App Router、React 19 |
| 组件 | `@heroui/react` **v3**（复合组件、`onPress`） |
| 样式 | Tailwind CSS **v4** + `src/styles/globals.css` token |
| 主题 | `next-themes`，`attribute="class"`，`darkMode: 'class'` |
| 工具 | `clsx` 合并 class；图标 `src/components/icons.tsx` |
| 全局 | `AppProviders`：`ThemeProvider` + `Toast.Provider` + `NextTopLoader` |

## 设计 token（优先用这些 class）

定义在 `src/styles/globals.css` 的 `:root` / `.dark` 与 `@theme inline`：

| 用途 | Class / 变量 |
|------|----------------|
| 页面底 | `bg-foreground`（博客主区域衬底） |
| 卡片/顶栏底 | `bg-background` |
| 主文字 | `text-text-base` |
| 次要文字 | `text-text-muted` |
| 更弱文字 | `text-text-sub` |
| 边框 | `border-border`、`border-default-200` |
| 强调/链接态 | `text-primary`、`hover:text-accent`、`text-accent` |
| 圆角 | `rounded-2xl`、`rounded-lg`（大卡片常用 `rounded-2xl`） |
| 阴影 | `shadow-sm` → `hover:shadow-md`（卡片悬停） |

**语义注意**：`bg-foreground` 在本项目中是浅灰页面背景，不是「前景色文字」；正文容器常用 `bg-background`。

## Server / Client 分工

- 默认 **Server Component**；仅 hooks、浏览器 API、事件、`useSession`、HeroUI 交互组件时加 `'use client'`。
- 在 Server 页面里引用需客户端的 HeroUI：用 `src/components/ui/heroui-client.tsx` 的 `ClientCard`、`ClientChip` 等，不要整页 `'use client'`。
- 客户端页面可直接 `import { Button, Table, ... } from "@heroui/react"`（参考 `admin/post/list/page.tsx`）。

## HeroUI v3 写法

```tsx
// 复合组件
<Card className="shadow-sm">
  <Card.Header>...</Card.Header>
  <Card.Content>...</Card.Content>
  <Card.Footer className="border-t border-border">...</Card.Footer>
</Card>

// 交互用 onPress，不用 onClick（Button、Dropdown.Item 等）
<Button onPress={() => router.push("/auth/signin")}>登录</Button>

// Chip
<Chip variant="soft" color={getTagColor(name)} size="sm">
  <Chip.Label>{name}</Chip.Label>
</Chip>
```

- 标签/分类色：统一 `getTagColor()`（`src/lib/tag-color.ts`），禁止手写随机色。
- Toast：全局已在 `providers.tsx` 配置；触发用 HeroUI Toast API，勿再包一层 Provider。
- 管理端复杂样式可用 `tv()` from `@heroui/react`（见 `sidebar.styles.ts`）。

## 博客前台 `(blog)`

**布局壳**：`src/app/(blog)/layout.tsx` — `bg-foreground` + `Navbar` + `Footer`。

| 模式 | 约定 |
|------|------|
| 内容宽度 | `mx-auto max-w-7xl px-4` |
| 三栏首页 | `lg:grid-cols-[280px_1fr_280px]`，侧栏 `fixed top-20 w-[280px]` |
| 顶栏 | `sticky top-0 z-50`，`border-b border-default-200 bg-background shadow` |
| 导航数据 | `siteConfig.navItems`（`src/config/site.ts`） |
| 站内链 | `next/link` 的 `NextLink`，不用 `<a>` 裸链内部路由 |
| 空状态 | `ClientCard` + `text-text-muted` 居中文案（见首页） |

**文章/UI 块**：`PostCard`、`ProfileSidebar`、`HotPosts`；详情与 Markdown 用 `article-md` 与 `article-markdown/config.tsx` 的 prose class，勿破坏 Shiki 双主题规则（`globals.css` 内 `.article-md` 代码块样式）。

## 管理后台 `(admin)`

**布局壳**：`AdminLayoutShell` → `layouts/admin/layout.tsx`（侧栏 + 顶栏，移动侧栏用 overlay）。

| 模式 | 约定 |
|------|------|
| 列表页 | `Table` + `Pagination` + 筛选 `Input`/`StringSelect` + `Alert` 错误 + `Spinner` 加载 |
| 数据请求 | `request` from `@/lib/request`，错误文案中文、简短 |
| 日期展示 | `toLocaleString('zh-CN', { ... })` 与列表页现有 formatter 一致 |
| 侧栏样式 | 复用 `Sidebar`/`tv` variants，色板 `border-border bg-background text-text-base` |

## 实现检查清单

完成 UI 改动后自检：

- [ ] 未引入 MUI、shadcn、Ant Design 等与 HeroUI 并行的库
- [ ] 新 class 使用项目 token（`text-text-*`、`bg-background`、`border-border`），避免裸 `text-gray-600`（除非与 footer 等既有写法一致）
- [ ] 深色模式：关键区块在 `.dark` 下可读（参考 `navbar` 的 `dark:invert-90` 等现有处理）
- [ ] 可访问性：`aria-label`（搜索、菜单、主题切换）、`textValue` on `Dropdown.Item`
- [ ] 响应式：移动菜单/遮罩模式与 `navbar.tsx` 一致（`lg:` 断点）
- [ ] 跑 `npm run lint` / `npm run typecheck`（若改了 TSX）

## 常见任务速查

| 任务 | 参考文件 |
|------|----------|
| 新博客页布局 | `src/app/(blog)/page.tsx` |
| 导航/搜索/用户菜单 | `src/components/layouts/blog/navbar.tsx` |
| 文章卡片 | `src/components/post/post-card.tsx` |
| 文章封面 | `src/components/post/post-cover.tsx`、`public/images/post-cover-placeholder.svg` |
| 侧栏资料+分类 | `src/components/layouts/blog/profile-sidebar.tsx` |
| 后台表格列表 | `src/app/(admin)/admin/post/list/page.tsx` |
| 主题切换 | `src/components/theme-switcher.tsx` |
| Markdown 排版 | `src/components/post/article-markdown/config.tsx` |

完整路径与目录说明见 [components.md](components.md)。

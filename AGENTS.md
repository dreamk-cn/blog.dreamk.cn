# dreamk-blog — Agent 指南

个人博客全栈项目：**Next.js App Router**、**Prisma + PostgreSQL**、**HeroUI v3**、**Tailwind v4**、**NextAuth**。单仓库承载前台站点、后台管理、API、评论、邮件通知与公开内容缓存。

## 分层职责

| 层 | 目录 | 职责 |
|----|------|------|
| Page / Layout | `src/app/` | 路由、数据编排、SEO；不写复杂业务 |
| API Route | `src/app/api/` | 解析请求、Zod 校验、权限、调用 service |
| Schema | `src/schemas/` | 请求/查询参数校验（Zod） |
| Service | `src/services/` | 业务规则、Prisma 查询、状态流转 |
| Lib | `src/lib/` | 通用工具（`api-response`、`request`、`public-cache` 等） |
| UI | `src/components/` | 展示与交互组件 |
| 数据模型 | `prisma/schema.prisma` | 领域模型与关系 |

数据流：`page/route` → `schemas`（校验）→ `services` → `prisma`

## 目录速查

- 博客前台：`src/app/(blog)/`
- 管理后台：`src/app/(admin)/admin/`
- 认证：`src/app/auth/`
- API：`src/app/api/`
- 业务逻辑：`src/services/`
- 参数校验：`src/schemas/`
- 全局样式 token：`src/styles/globals.css`

## 三条硬约定

1. **API 响应**：统一 HTTP 200，成败由 body 的 `code` 表达。复用 `src/lib/api-response.ts` 的 `ok` / `fail` 等，不要直接拼 `NextResponse.json`。
2. **职责边界**：Service 不写 HTTP / React；Route 不写复杂 Prisma 查询。
3. **UI**：只用 HeroUI v3 + 项目 Tailwind token，不引入并行 UI 库。细节见 `.cursor/skills/blog-ui/SKILL.md`。

## Cursor Rules（按文件 glob 触发）

| Rule | 触发范围 | 用途 |
|------|----------|------|
| `typescript-project-conventions.mdc` | `src/**/*.ts` | TS 通用编码约定 |
| `react-next-app-router.mdc` | `src/**/*.tsx`、`src/components/**/*.ts` | Server/Client、App Router、组件 hook |
| `api-route-conventions.mdc` | `src/app/api/**/*.ts` | Route 校验、响应、权限 |
| `service-layer-conventions.mdc` | `src/services/**/*.ts` | Service 与 Prisma 访问 |
| `prisma-schema-conventions.mdc` | `prisma/schema.prisma` | 模型、索引、关系 |
| `public-cache-conventions.mdc` | service / api / blog page / `public-cache.ts` | 公开内容缓存与失效 |
| `zod-schema-conventions.mdc` | `src/schemas/**/*.ts` | Zod schema 命名与模式 |

Rules 位于 `.cursor/rules/`。

## Cursor Skills（按任务描述触发）

| Skill | 何时使用 |
|-------|----------|
| `blog-ui` | 页面、组件、布局、样式、表单、表格等 **纯 UI** 工作 |
| `blog-fullstack` | 新增/修改 CRUD、API、schema、service、Prisma、缓存失效等 **全栈功能** |

Skills 位于 `.cursor/skills/`。

## 常见工作流

- **只改 UI** → 读 `blog-ui` skill，参考 `components.md` 找同类组件。
- **加后台 CRUD / API** → 读 `blog-fullstack` skill，按 Prisma → schema → service → route 流水线；涉及 UI 再切 `blog-ui`。
- **改公开列表/详情缓存** → 读 `public-cache` rule；读用 `cachePublicContent`，写后按需 `revalidatePublicCache`。

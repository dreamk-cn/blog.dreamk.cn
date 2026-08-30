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

## Cursor Cloud specific instructions

依赖刷新（`pnpm install`，含 `postinstall` 的 `prisma generate`）由启动更新脚本自动完成。以下为**非显而易见**的运行注意事项：

- **PostgreSQL 是原生 apt 安装，非 Docker**（该环境无 Docker）。每个会话需手动启动：`sudo pg_ctlcluster 16 main start`。数据库 `blog`、用户 `blog`、密码 `blog_password`，监听 `127.0.0.1:5432`，与 `.env.example` 的 `DATABASE_URL` 一致。数据目录随快照持久化。
- **需要 `.env.development`（被 `.gitignore` 忽略，不入库）**，最少含 `DATABASE_URL`、`AUTH_SECRET`（`openssl rand -base64 32`）、`ADMIN_EMAIL`。Next.js 读 `.env.development`；**Prisma CLI 只读 `.env`**，跑 `pnpm prisma migrate deploy` 前需 `export DATABASE_URL=...`。
- 初始化 schema：`export DATABASE_URL=postgresql://blog:blog_password@127.0.0.1:5432/blog?schema=public && pnpm prisma migrate deploy`。
- 开发服务器 `pnpm dev`（Turbopack，端口 3000）。lint/typecheck/test 见 `package.json`（`pnpm lint` / `pnpm typecheck` / `pnpm test`）。
- **注册需邮箱验证码；未配 SMTP 时，dev 下验证码打印在服务端日志**：`[register-verify] email=<x> code=<6位>`。据此可脚本化注册。邮箱等于 `ADMIN_EMAIL` 的新用户自动获得 `ADMIN` 角色。
- 前台文章详情路由为 `/posts/<slug>`；前台仅展示 `PUBLISHED` 文章。

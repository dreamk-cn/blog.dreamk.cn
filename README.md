# dreamk-blog

`dreamk-blog` 是一个基于 `Next.js App Router + Prisma + PostgreSQL` 的个人博客系统。它采用单体式全栈架构，在一个项目中同时承载前台站点、后台管理、接口层、鉴权、评论系统、邮件通知、应用缓存和部分 AI 辅助能力。

适合用作个人博客、轻量内容管理系统（CMS）或作为 `Next.js + Prisma` 全栈项目模板继续扩展。

## 项目概览

项目当前主要分为两部分：

- 前台博客：文章展示、分类浏览、About 页面、评论、友链、主题切换、SEO
- 后台管理：仪表盘、文章管理、评论审核、用户管理、分类标签管理、友链管理、缓存运维

其中 About 页面并不是单独的静态文档，而是约定使用一篇 `slug = about` 的文章来驱动展示。

## 核心功能

### 前台能力

- 首页文章流与热门文章榜
- 文章列表、分页、关键字检索
- 文章详情页
- Markdown 渲染、代码高亮、目录 TOC
- 分类页与分类下文章分页
- About 页面
- 评论展示、回复、楼层锚点定位
- 浏览量统计
- 友链展示
- 明暗主题切换
- `robots.txt` 与 `sitemap.xml`

### 后台能力

- 管理员登录后进入后台
- 仪表盘总览文章、评论、用户、分类、标签、友链等统计
- 文章创建、编辑、删除、发布状态管理
- 分类管理
- 标签管理
- 评论审核、删除
- 用户状态管理
- 友链管理
- 应用缓存列表、按 key 删除、清理过期缓存、清理匿名评论限流缓存

### 系统能力

- `NextAuth` 登录鉴权
- 支持邮箱密码登录
- 支持 GitHub / Google 第三方登录
- 基于角色的后台权限控制
- 邮件通知评论与回复
- AI 自动生成文章摘要和 slug
- 匿名评论限流
- 预留可扩展缓存驱动（当前实现为 PostgreSQL）

## 技术架构

### 技术栈

- `Next.js 16` + `React 19`
- `App Router`
- `Prisma` + `PostgreSQL`
- `NextAuth v5`
- `Tailwind CSS v4` + `HeroUI v3`
- `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki`
- `Recharts`
- `nodemailer`
- `OpenAI SDK`（接 DeepSeek 兼容接口）
- `Docker Compose`

### 分层说明

项目整体是典型的 `Next.js BFF` 风格：

`Page / API Route` -> `参数校验 / 鉴权` -> `Service` -> `Prisma` -> `PostgreSQL`

各层职责大致如下：

- `src/app`：页面路由与 API 路由
- `src/components`：页面与业务组件
- `src/services`：业务逻辑与数据编排
- `src/lib`：底层能力，如 Prisma、缓存、邮件、AI、权限辅助
- `src/schemas`：接口入参校验
- `prisma/schema.prisma`：数据库模型定义

### 核心模型

数据库主要包含以下实体：

- `User`：用户、角色、状态
- `Post`：文章、状态、浏览量、分类、标签
- `Category`：分类
- `Tag`：标签
- `Comment`：评论与回复树
- `FriendLink`：友情链接
- `AppCache`：应用级键值缓存
- `Account / Session / VerificationToken`：NextAuth 相关表

## 目录结构

```text
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (blog)/          # 前台页面
│   │   ├── (admin)/         # 后台页面
│   │   ├── api/             # 服务端接口
│   │   ├── layout.tsx
│   │   ├── providers.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/          # UI 与业务组件
│   ├── services/            # 业务服务层
│   ├── lib/                 # 基础能力封装
│   ├── schemas/             # Zod 校验
│   ├── config/              # 站点与内容配置
│   ├── styles/
│   └── types/
├── docker-compose.yml
├── next.config.ts
└── README.md
```

## 本地开发

开发时推荐只在 Docker 中运行数据库，应用直接在本机启动，这样热更新和调试体验更好。

### 1. 启动数据库

```bash
docker compose up -d db
```

### 2. 配置环境变量

建议维护 `.env.development`，最少先配置：

```env
DATABASE_URL=postgresql://blog:blog_password@127.0.0.1:5432/blog?schema=public
NEXT_PUBLIC_BASE_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-random-secret
ADMIN_EMAIL=your-admin@example.com
```

### 3. 安装依赖并初始化数据库

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
```

### 4. 启动开发服务器

```bash
pnpm dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

### 常用命令

```bash
pnpm lint
pnpm typecheck
docker compose logs -f db
docker compose down
```

## 部署

项目内置了 `docker-compose.yml`，可直接部署应用与 PostgreSQL。

### 启动

```bash
docker compose up -d --build
```

容器启动时会执行：

```bash
pnpm prisma migrate deploy && pnpm build && pnpm start
```

### 查看日志

```bash
docker compose logs -f app
docker compose logs -f db
```

### 停止服务

```bash
docker compose down
```

## 环境变量

建议分别维护 `.env.development` 与 `.env.production`。

### 基础必填

- `DATABASE_URL`：Prisma 连接 PostgreSQL
- `NEXT_PUBLIC_BASE_URL`：站点公开访问地址
- `AUTH_SECRET`：NextAuth 密钥
- `ADMIN_EMAIL`：与该邮箱匹配的新用户会自动授予管理员权限

### 可选登录配置

- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

### 邮件通知

- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

未配置邮件相关变量时，评论通知功能会自动跳过发信。

### AI 辅助

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_EXCERPT_MODEL`
- `DEEPSEEK_SLUG_MODEL`

用于后台生成文章摘要和 slug；未配置时对应功能不可用。

### 阿里云 OSS（媒体上传）

上传封面与正文插图需要配置以下变量（文件存储在 Bucket 的 `blog/` 前缀下，便于多项目共用）：

- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- `OSS_ENDPOINT`：如 `oss-cn-hangzhou.aliyuncs.com`
- `OSS_BUCKET`
- `OSS_REGION`
- `OSS_URL`：公开访问域名（CDN 或 Bucket 域名，不含末尾 `/`）
- `OSS_MAX_FILE_SIZE_MB`：可选，默认 `5`

Bucket 需允许 `blog/` 路径公共读（或通过 CDN 回源）。媒体元数据保存在 PostgreSQL `MediaFile` 表，支持本地上传与外链登记，文章通过 `PostCoverMedia`（多封面有序）与 `PostContentMedia`（正文插图）建立引用。

### 缓存与限流

- `CACHE_DRIVER`：默认 `postgres`
- `ANONYMOUS_COMMENT_RATE_MAX`：匿名评论窗口内允许次数，默认 `5`
- `ANONYMOUS_COMMENT_RATE_WINDOW_SEC`：匿名评论窗口秒数，默认 `60`

## 权限与内容约定

- `/admin` 路由仅允许管理员访问
- 普通登录用户可直接发表评论，匿名评论默认进入待审核状态
- `slug = about` 的已发布文章会被渲染为 About 页面
- 前台只展示 `PUBLISHED` 状态文章

## 后续可继续完善

- 评论通知去重，避免审核状态反复变更或重试时重复发信
- 缓存驱动扩展到 Redis
- 更完善的文章搜索、归档和标签聚合页
- 前台 RSS / Feed 输出

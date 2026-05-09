# dreamk-blog

`dreamk-blog` 是一个基于 Next.js App Router + Prisma + PostgreSQL 的个人博客项目，支持文章、评论、分类、标签、友链与后台管理。

## 技术栈

- Next.js 16
- React 19
- Prisma + PostgreSQL
- NextAuth
- Tailwind CSS v4 + HeroUI v3
- Docker Compose（应用与数据库部署）

## 本地开发

开发时推荐只在 Docker 里运行数据库，应用在本机运行，热更新和调试体验最好。

1) 启动数据库：

```bash
docker compose up -d db
```

2) 在 `.env.development` 配置数据库连接：

```env
DATABASE_URL=postgresql://blog:blog_password@127.0.0.1:5432/blog?schema=public
```

3) 安装依赖并启动开发服务：

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

4) 打开 [http://localhost:3000](http://localhost:3000)。

常用命令：

```bash
docker compose logs -f db
docker compose down
```

## 部署

项目提供了 `docker-compose.yml`，可直接部署应用和 PostgreSQL。

1) 启动（构建并后台运行）：

```bash
docker compose up -d --build
```

2) 查看日志：

```bash
docker compose logs -f app
docker compose logs -f db
```

3) 停止服务：

```bash
docker compose down
```

## 环境变量说明

至少需要配置以下变量（建议分别维护 `.env.development` / `.env.production`）：

- `DATABASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `AUTH_SECRET`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`（如启用 GitHub 登录）
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`（如启用 Google 登录）
- `ADMIN_EMAIL`

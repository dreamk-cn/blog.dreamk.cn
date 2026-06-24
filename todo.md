# 项目优化 Todo

基于代码库维护性、可读性、健壮性审查整理。已完成项打 `[x]`，待办打 `[ ]`。

---

## 已完成

- [x] **环境变量集中校验** — `src/config/env.ts` + `src/instrumentation.ts`，Zod 解析、可选功能组成对校验、启动 fail-fast
- [x] **`.env.example` 模板** — 根目录提交占位模板，README 补充 `cp .env.example .env.development`
- [x] **客户端安全 public env** — `src/config/env.public.ts`，`site-url` / `utils/env` / `error.tsx` 统一入口
- [x] **工具函数去重（部分）** — `pagination`、`email`、`text`、`site-url`（`postPath` 等）抽取到 `src/lib/`
- [x] **API 响应约定文档化** — HTTP 尽量 200 + body.`code`；见下文「设计约定」与 `.cursor/rules/api-route-conventions.mdc`
- [x] **`tooManyRequests` 改为 HTTP 200** — `src/lib/api-response.ts`，限流语义由 body `code: 429` 表达
- [x] **API 错误码统一** — `ResponseCode.CONFLICT`、`conflict()` / `notFound()`；route 不再使用裸数字 `fail(400/409/500)`
- [x] **Prisma 错误统一映射** — `src/lib/prisma-errors.ts`，P2002 / P2025 / P2003
- [x] **API Route 公共包装** — `src/lib/route-handler.ts`（`parseJson`、`handleRouteError`、`withAdmin`、`withRoute`）；已迁移 categories / tags / friend-links / users
- [x] **NextAuth 凭证登录限流对齐** — `[...nextauth]/route.ts` 复用 `tooManyRequests`；`credentials-login.ts` 读 body `code`
- [x] **API Route 全量迁移至 `route-handler`** — 除 `[...nextauth]` 外均已使用 `withRoute` / `withAdmin`；`route-handler` 支持 `mapError`（upload OSS）
- [x] **`POST /api/post/view` 限流** — `post-view-rate-limit.ts` + `consumePostViewRateLimit`，按 IP + slug 固定窗口；`POST_VIEW_RATE_*` 见 `.env.example`
- [x] **IP 限流信任链** — `request-ip.ts` 仅在 `TRUST_PROXY=true` 时信任 `X-Forwarded-For` / `X-Real-IP`
- [x] **管理后台边缘鉴权（`proxy.ts`）** — `auth()` + ADMIN 角色校验 + `NextResponse.next()`；访问日志 `waitUntil`
- [x] **前台 URL 统一** — `post-card.tsx`、`hot-posts.tsx` 等已用 `postPath()` / `categoryPath()`（`src/lib/site-url.ts`）
- [x] **`requireAdmin()` 类型收窄（API 层）** — `AdminSession` + `withAdmin` 的 `AdminAuth`；`admin.session.user.id` 无需 `as string`（service 等处仍有少量 `as`）
- [x] **目录整理（hooks / verify）** — 仅保留 `src/hooks/`；`src/components/hooks/`、`src/utils/verify.ts` 已移除
- [x] **关键单元测试** — Vitest + `vite-tsconfig-paths`；覆盖 `normalizeSlug`、`buildPageNumbers`、`truncateText`、`readRateLimitEnvInt`、`mapPrismaError` 及 post/comment/auth/media/page schema（`pnpm test`）

---

## 设计约定

### API 响应：HTTP 尽量 200，业务语义看 body.`code`

本项目 **不** 用 HTTP 状态码表达业务成败（监控、网关除外）。约定如下：

- 正常 JSON 响应统一 **HTTP 200**，结构固定为 `{ code, message, data }`
- 客户端（`src/lib/request.ts`）在响应拦截器里读 **`data.code`**，非 `200` 即业务失败
- `code` 取值见 `src/config/response-code.ts`（`400` 参数/业务失败、`401` 未登录、`403` 无权限、`409` 冲突、`429` 限流、`500` 服务器错误等）
- 新增 route 时复用 `src/lib/api-response.ts` 与 `src/lib/route-handler.ts`，**不要**为单个接口单独设置 `401`/`403`/`500` 等 HTTP status

---

## 高优先级

### 测试与 CI

- [ ] 补充 API 集成测试：注册、评论、文章 CRUD
- [ ] 添加 GitHub Actions：`prisma generate → lint → typecheck → test`

### 安全

- [ ] **管理后台 layout 二次鉴权** — `(admin)/layout.tsx` 服务端 `auth()` + `redirect()`（边缘层已由 `proxy.ts` 覆盖，layout 作纵深防御）

---

## 中优先级

### 代码去重与结构

- [ ] **Category / Tag 服务去重** — `category-service.ts` 与 `tag-service.ts` 结构几乎相同，可抽 factory 或共享内部模块（已有 `taxonomy-helpers` 部分共享）
- [ ] **拆分超大模块** — `post-service.ts`（查询 / 变更 / AI）、`post-form.tsx`（表单区块拆子组件）
- [ ] **Admin 列表页抽象** — `useAdminListQuery` + 通用表格壳，减少各 list 页重复搜索/loading/modal/删除确认

### 访问日志

- [ ] **定期清理任务** — `purgeOldAccessLogs()` 与 `env.accessLogRetentionDays`（默认 90 天）已在 `access-log-service.ts` 实现，需接入调度（如 cron API、Vercel Cron、或 instrumentation 周期任务），避免 `AccessLog` 表无限增长

### 配置（可选深化）

- [ ] **`next.config.ts` 与 `env` 共用 OSS_URL** — 已从 `process.env` 读并配 `images.remotePatterns`；待与 `env.public` 或薄 helper 去重复（注意构建阶段加载顺序）

---

## 低优先级

- [ ] **评论 API 命名文档化** — 公开 `/api/post/comment` vs 管理 `/api/comments`，README 说明或后续统一路径
- [ ] **Prettier / Husky** — 统一格式化，减少协作时 style drift
- [ ] **结构化日志** — 替换 route 中散落的 `console.error`，可加 requestId
- [ ] **NextAuth beta 升级路径** — 当前 `5.0.0-beta.29`，上线前规划稳定版迁移
- [ ] **Docker 构建优化** — 镜像内 `pnpm build`，启动仅 `migrate deploy` + `start`
- [ ] **外链媒体 SSRF 防护** — `ExternalMediaSchema` 存储任意 URL，确认展示层不做服务端 fetch，可考虑域名白名单

---

## 建议实施顺序

1. ~~**快赢**~~ — view 限流、Prisma 错误映射、trust proxy、前台 URL（已完成）
2. **基础设施** — admin layout 二次鉴权、访问日志定期清理
3. **质量网（持续）** — 测试 + CI
4. **按需重构** — category/tag factory、大文件拆分、admin 列表抽象、`next.config` OSS 去重

---

## 参考

- 环境变量说明：[`.env.example`](.env.example)、[README 环境变量章节](README.md)
- API 约定：`.cursor/rules/api-route-conventions.mdc`
- Service 约定：`.cursor/rules/service-layer-conventions.mdc`

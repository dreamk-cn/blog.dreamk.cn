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

- [ ] 补充单元测试：`normalizeSlug`、`buildPageNumbers`、`truncateText`、`readRateLimitEnvInt`、关键 Zod schema
- [ ] 补充 API 集成测试：注册、评论、文章 CRUD
- [ ] 添加 GitHub Actions：`prisma generate → lint → typecheck → test`

### 安全

- [ ] **`POST /api/post/view` 加限流** — 复用 `consumeFixedWindowRateLimit`，按 IP + slug 限流，可选每日去重
- [ ] **管理后台纵深防御** — `src/app/(admin)/layout.tsx` 服务端 `auth()` + `redirect()`；`proxy.ts` 补 `NextResponse.next()`、轻量 cookie 检查
- [ ] **IP 限流信任链** — `src/lib/request-ip.ts` 仅在 `TRUST_PROXY=true` 时读 `X-Forwarded-For`

---

## 中优先级

### 代码去重与结构

- [ ] **Category / Tag 服务去重** — `category-service.ts` 与 `tag-service.ts` 结构几乎相同，可抽 factory 或共享内部模块
- [ ] **前台 URL 统一** — `post-card.tsx`、`hot-posts.tsx` 改用 `postPath()`；分类 URL 可抽 `categoryPath(slug)`
- [ ] **拆分超大模块** — `post-service.ts`（查询 / 变更 / AI）、`post-form.tsx`（表单区块拆子组件）
- [ ] **Admin 列表页抽象** — `useAdminListQuery` + 通用表格壳，减少各 list 页重复搜索/loading/modal/删除确认

### 一致性与类型

- [ ] **`requireAdmin()` 类型收窄** — 返回 `{ user: { id: string; role: 'ADMIN' } }`，去掉各处 `as string`
- [ ] **目录整理** — 合并 `src/hooks/` 与 `src/components/hooks/`；`src/utils/verify.ts` 与 schemas 对齐

### 访问日志

- [ ] **定期清理任务** — `purgeOldAccessLogs()` 与 `env.accessLogRetentionDays`（默认 90 天）已在 `access-log-service.ts` 实现，需接入调度（如 cron API、Vercel Cron、或 instrumentation 周期任务），避免 `AccessLog` 表无限增长

### 配置（可选深化）

- [ ] **`next.config.ts` 读 OSS_URL** — 可与 `env.public` 或薄 helper 共用，降低与 `env.ts` 的重复（注意构建阶段加载顺序）

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

1. **快赢（1～2 天）** — view 限流、Prisma 错误映射、trust proxy
2. **基础设施（约 1 周）** — route 包装器、admin 鉴权加固
3. **质量网（持续）** — 测试 + CI
4. **按需重构** — category/tag 去重、大文件拆分、admin 列表抽象；NextAuth 限流响应与标准 envelope 对齐（可选）

---

## 参考

- 环境变量说明：[`.env.example`](.env.example)、[README 环境变量章节](README.md)
- API 约定：`.cursor/rules/api-route-conventions.mdc`
- Service 约定：`.cursor/rules/service-layer-conventions.mdc`

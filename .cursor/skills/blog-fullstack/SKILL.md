---
name: blog-fullstack
description: >-
  Add or change CRUD/API/data features for blog.dreamk.cn: Zod schemas, services,
  API routes, Prisma models, cache invalidation, and optional admin UI. Use when
  implementing new endpoints, backend workflows, or full-stack features.
---

# blog.dreamk.cn 全栈功能

## 开始前

1. 判断改动类型：**只读公开接口** / **管理员写操作** / **需改 Prisma schema**。
2. 找 1 个同类现有实现对照（见下方参考），复制分层结构而非从零发明模式。
3. 各层约定见 `.cursor/rules/` 对应 rule；本 skill 串联流水线。

## 标准流水线

按顺序完成，可勾选：

- [ ] **Prisma**（若需新字段/模型）→ `prisma/schema.prisma`，改后 migrate + 检查 service/schema
- [ ] **Schema** → `src/schemas/*.ts`，rule: `zod-schema-conventions.mdc`
- [ ] **Service** → `src/services/*-service.ts`，rule: `service-layer-conventions.mdc`
- [ ] **API Route** → `src/app/api/**/route.ts`，rule: `api-route-conventions.mdc`
- [ ] **缓存**（若影响公开读）→ 读侧 `cachePublicContent`；写侧 `revalidatePublicCache`，rule: `public-cache-conventions.mdc`
- [ ] **Admin UI**（可选）→ 后台列表/表单页，切 `blog-ui` skill

## Route 要点

- 管理员写操作用 `withAdmin`；公开读/游客写用 `withRoute`。
- 请求体用 `parseJson`；校验用 schema `.parse()`，错误由 `handleRouteError` 统一处理。
- 响应只用 `src/lib/api-response.ts` 的 `ok` / `fail` 等；HTTP 状态码统一 200。
- Prisma 已知错误配置 `prismaMessages` 或依赖 `mapPrismaError`。
- Route 不写复杂 Prisma；权限用 `requireAdmin()` 或 `auth()`。

## 参考实现（评论 CRUD）

| 层 | 文件 |
|----|------|
| Schema | `src/schemas/comment.ts` |
| Service | `src/services/comment-service.ts` |
| Route | `src/app/api/comments/route.ts` |

评论 route 还演示了：审核后 `shouldRevalidatePublicComments` + `revalidatePublicCache`、异步邮件通知。

其他可参考：文章 `src/app/api/post/route.ts` + `src/services/post-service.ts`（含 Prisma 错误映射）。

## Service 返回值

- 查不到：`null`
- 状态变更：`{ updated, previousStatus }` 等结构化结果
- 批量操作：`{ count }` 等
- 由 route 决定 `fail` 文案，service 不抛泛化 HTTP 错误

## 收尾自检

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] 公开写操作是否需补 cache 失效
- [ ] 若改了后台 UI，对照 `blog-ui` skill 检查清单

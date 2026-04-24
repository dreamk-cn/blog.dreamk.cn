FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --no-frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
RUN corepack enable

COPY --from=builder /app ./

EXPOSE 3000
CMD ["pnpm", "start"]

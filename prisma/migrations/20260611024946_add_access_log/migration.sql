-- CreateEnum
CREATE TYPE "public"."VisitorKind" AS ENUM ('HUMAN', 'CRAWLER', 'PREVIEW', 'UNKNOWN');

-- CreateTable
CREATE TABLE "public"."AccessLog" (
    "id" TEXT NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "pathname" VARCHAR(500) NOT NULL,
    "query" VARCHAR(1000),
    "ip" VARCHAR(45),
    "userAgent" TEXT,
    "referer" VARCHAR(2000),
    "visitorKind" "public"."VisitorKind" NOT NULL DEFAULT 'UNKNOWN',
    "botName" VARCHAR(100),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "public"."AccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_pathname_idx" ON "public"."AccessLog"("pathname");

-- CreateIndex
CREATE INDEX "AccessLog_ip_idx" ON "public"."AccessLog"("ip");

-- CreateIndex
CREATE INDEX "AccessLog_visitorKind_idx" ON "public"."AccessLog"("visitorKind");

-- CreateIndex
CREATE INDEX "AccessLog_userId_idx" ON "public"."AccessLog"("userId");

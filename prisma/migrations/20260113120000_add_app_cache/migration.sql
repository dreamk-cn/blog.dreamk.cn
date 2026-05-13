-- CreateTable
CREATE TABLE "public"."AppCache" (
    "key" VARCHAR(512) NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppCache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "AppCache_expiresAt_idx" ON "public"."AppCache"("expiresAt");

/*
  Warnings:

  - You are about to drop the column `coverUrl` on the `Post` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MediaSource" AS ENUM ('UPLOAD', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "public"."MediaCategory" AS ENUM ('ASSET', 'COVER', 'CONTENT');

-- CreateEnum
CREATE TYPE "public"."MediaStatus" AS ENUM ('ACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "coverUrl";

-- CreateTable
CREATE TABLE "public"."MediaFile" (
    "id" TEXT NOT NULL,
    "source" "public"."MediaSource" NOT NULL,
    "key" VARCHAR(512),
    "url" VARCHAR(1024) NOT NULL,
    "originalName" VARCHAR(255),
    "mimeType" VARCHAR(100),
    "size" INTEGER,
    "category" "public"."MediaCategory" NOT NULL DEFAULT 'ASSET',
    "status" "public"."MediaStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostCoverMedia" (
    "postId" TEXT NOT NULL,
    "mediaFileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostCoverMedia_pkey" PRIMARY KEY ("postId","mediaFileId")
);

-- CreateTable
CREATE TABLE "public"."PostContentMedia" (
    "postId" TEXT NOT NULL,
    "mediaFileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostContentMedia_pkey" PRIMARY KEY ("postId","mediaFileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaFile_key_key" ON "public"."MediaFile"("key");

-- CreateIndex
CREATE INDEX "MediaFile_userId_idx" ON "public"."MediaFile"("userId");

-- CreateIndex
CREATE INDEX "MediaFile_source_category_status_createdAt_idx" ON "public"."MediaFile"("source", "category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PostCoverMedia_postId_sortOrder_idx" ON "public"."PostCoverMedia"("postId", "sortOrder");

-- CreateIndex
CREATE INDEX "PostCoverMedia_mediaFileId_idx" ON "public"."PostCoverMedia"("mediaFileId");

-- CreateIndex
CREATE INDEX "PostContentMedia_mediaFileId_idx" ON "public"."PostContentMedia"("mediaFileId");

-- AddForeignKey
ALTER TABLE "public"."MediaFile" ADD CONSTRAINT "MediaFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostCoverMedia" ADD CONSTRAINT "PostCoverMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostCoverMedia" ADD CONSTRAINT "PostCoverMedia_mediaFileId_fkey" FOREIGN KEY ("mediaFileId") REFERENCES "public"."MediaFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostContentMedia" ADD CONSTRAINT "PostContentMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostContentMedia" ADD CONSTRAINT "PostContentMedia_mediaFileId_fkey" FOREIGN KEY ("mediaFileId") REFERENCES "public"."MediaFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

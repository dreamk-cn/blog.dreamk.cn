-- DropForeignKey
ALTER TABLE "public"."Post" DROP CONSTRAINT "Post_userId_fkey";

-- DropIndex
DROP INDEX "public"."Post_slug_idx";

-- DropIndex
DROP INDEX "public"."Category_slug_idx";

-- DropIndex
DROP INDEX "public"."Tag_slug_idx";

-- CreateIndex
CREATE INDEX "Post_status_publishedAt_createdAt_idx" ON "public"."Post"("status", "publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Post_categoryId_status_publishedAt_idx" ON "public"."Post"("categoryId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Comment_postId_status_parentId_createdAt_idx" ON "public"."Comment"("postId", "status", "parentId", "createdAt");

-- CreateIndex
CREATE INDEX "FriendLink_status_sortOrder_createdAt_idx" ON "public"."FriendLink"("status", "sortOrder", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

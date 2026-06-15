import { auth } from "@/auth";
import { ResponseCode } from "@/config/response-code";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { collectPostSlugs, collectTagSlugs, isPostWithTags } from "@/lib/post-revalidation";
import { revalidatePostAndTagCaches } from "@/lib/public-cache";
import { parseJson, withAdmin, withRoute } from "@/lib/route-handler";
import { PostCreateSchema, PostDeleteSchema, PostDetailSchema, PostUpdateSchema } from "@/schemas/post";
import { createPost, deletePosts, getPostDetail, updatePost } from "@/services/post-service";
import { NextResponse } from "next/server";

const POST_PRISMA_MESSAGES = {
  P2002: "Slug已存在，请换一个",
  P2025: "关联的分类或标签不存在",
};

export const GET = withRoute(async (request) => {
  const { searchParams } = request.nextUrl;
  const { id, slug, status } = PostDetailSchema.parse({
    id: searchParams.get("id"),
    slug: searchParams.get("slug"),
    status: searchParams.get("status"),
  });

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const post = await getPostDetail({ id, slug, status, isAdmin });

  if (!post) {
    return fail(ResponseCode.FAIL, "文章不存在");
  }

  return ok(post, "获取文章成功");
}, "获取文章失败");

export const POST = withAdmin(async (request, admin) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = PostCreateSchema.parse(json ?? {});
  const {
    title,
    slug,
    content,
    excerpt,
    status,
    featured,
    coverMediaFileIds,
    contentMediaFileIds,
    categoryId,
    category,
    tags,
    publishedAt,
  } = parsed;

  const newPost = await createPost({
    userId: admin.session.user.id as string,
    title,
    slug,
    content,
    excerpt,
    status,
    featured,
    coverMediaFileIds,
    contentMediaFileIds,
    categoryId: categoryId || undefined,
    category,
    tags,
    publishedAt,
  });

  if (newPost && "error" in newPost && newPost.error) {
    return fail(ResponseCode.FAIL, newPost.error);
  }

  if (isPostWithTags(newPost)) {
    revalidatePostAndTagCaches({
      postSlugs: [newPost.slug],
      tagSlugs: collectTagSlugs(newPost.tags),
    });
  }

  return ok(newPost, "创建文章成功");
}, { logLabel: "创建文章失败", prismaMessages: POST_PRISMA_MESSAGES });

export const PUT = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = PostUpdateSchema.parse(json ?? {});
  const {
    id,
    title,
    slug,
    content,
    excerpt,
    status,
    featured,
    coverMediaFileIds,
    contentMediaFileIds,
    categoryId,
    category,
    tags,
    publishedAt,
  } = parsed;

  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { slug: true, tags: { select: { slug: true } } },
  });

  const updatedPost = await updatePost({
    id,
    title,
    slug,
    content,
    excerpt,
    status,
    featured,
    coverMediaFileIds,
    contentMediaFileIds,
    categoryId: categoryId || undefined,
    category,
    tags,
    publishedAt,
  });

  if (!updatedPost) {
    return fail(ResponseCode.FAIL, "文章不存在");
  }

  if ("error" in updatedPost && updatedPost.error) {
    return fail(ResponseCode.FAIL, updatedPost.error);
  }

  if (isPostWithTags(updatedPost)) {
    revalidatePostAndTagCaches({
      postSlugs: collectPostSlugs(existingPost, updatedPost),
      tagSlugs: collectTagSlugs(existingPost?.tags, updatedPost.tags),
    });
  }

  return ok(updatedPost, "更新文章成功");
}, { logLabel: "更新文章失败", prismaMessages: POST_PRISMA_MESSAGES });

export const DELETE = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { ids } = PostDeleteSchema.parse(json ?? {});
  const postsToDelete = await prisma.post.findMany({
    where: { id: { in: ids } },
    select: { slug: true, tags: { select: { slug: true } } },
  });
  const { count } = await deletePosts(ids);

  revalidatePostAndTagCaches({
    postSlugs: collectPostSlugs(postsToDelete),
    tagSlugs: collectTagSlugs(...postsToDelete.map((post) => post.tags)),
  });

  return ok(null, `删除${count}条文章`);
}, "删除文章失败");

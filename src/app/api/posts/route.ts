import { auth } from '@/auth';
import { ok } from '@/lib/api-response';
import { withRoute } from '@/lib/route-handler';
import { PostListSchema } from '@/schemas/post';
import { listPosts } from '@/services/post-service';

export const GET = withRoute(async (request) => {
  const { searchParams } = request.nextUrl;
  const parsedParams = PostListSchema.parse({
    pageNo: searchParams.get('pageNo'),
    pageSize: searchParams.get('pageSize'),
    keyword: searchParams.get('keyword'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
    status: searchParams.get('status'),
  });

  const session = await auth();
  const isAdmin = session?.user.role === 'ADMIN';
  const { pageNo, pageSize, keyword, sortBy, sortOrder, status } = parsedParams;
  const { posts, total } = await listPosts({
    pageNo,
    pageSize,
    keyword: keyword ?? undefined,
    sortBy,
    sortOrder,
    status,
    isAdmin,
  });

  return ok({
    list: posts,
    total,
    totalPages: Math.ceil(total / pageSize),
    pageNo,
    pageSize,
    sortBy,
    sortOrder,
  }, '获取文章列表成功');
}, '获取文章列表失败');

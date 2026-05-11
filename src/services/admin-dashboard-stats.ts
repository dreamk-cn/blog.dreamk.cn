import { prisma } from '@/lib/prisma';

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  totalViews: number;
  totalComments: number;
  pendingComments: number;
  approvedComments: number;
  spamComments: number;
  totalUsers: number;
  totalCategories: number;
  totalTags: number;
  totalFriendLinks: number;
  pendingFriendLinks: number;
  postsLast30Days: { date: string; count: number }[];
  viewsLast30Days: { date: string; views: number }[];
  recentPosts: {
    id: string;
    title: string;
    status: string;
    viewCount: number;
    createdAt: string;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    postStats,
    totalViews,
    commentStats,
    totalUsers,
    totalCategories,
    totalTags,
    friendLinkStats,
    recentPostsRaw,
    postsCreatedRaw,
  ] = await Promise.all([
    prisma.post.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.comment.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.user.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.friendLink.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        viewCount: true,
        createdAt: true,
      },
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const postStatusMap = Object.fromEntries(
    postStats.map((s) => [s.status, s._count.id])
  );
  const commentStatusMap = Object.fromEntries(
    commentStats.map((s) => [s.status, s._count.id])
  );
  const friendLinkStatusMap = Object.fromEntries(
    friendLinkStats.map((s) => [s.status, s._count.id])
  );

  // Build 30-day buckets
  const postsByDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    postsByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const post of postsCreatedRaw) {
    const day = post.createdAt.toISOString().slice(0, 10);
    if (day in postsByDay) {
      postsByDay[day]++;
    }
  }

  const postsLast30Days = Object.entries(postsByDay).map(([date, count]) => ({
    date,
    count,
  }));

  const totalPosts =
    (postStatusMap['PUBLISHED'] ?? 0) +
    (postStatusMap['DRAFT'] ?? 0) +
    (postStatusMap['ARCHIVED'] ?? 0);

  return {
    totalPosts,
    publishedPosts: postStatusMap['PUBLISHED'] ?? 0,
    draftPosts: postStatusMap['DRAFT'] ?? 0,
    archivedPosts: postStatusMap['ARCHIVED'] ?? 0,
    totalViews: totalViews._sum.viewCount ?? 0,
    totalComments:
      (commentStatusMap['PENDING'] ?? 0) +
      (commentStatusMap['APPROVED'] ?? 0) +
      (commentStatusMap['SPAM'] ?? 0) +
      (commentStatusMap['DELETED'] ?? 0),
    pendingComments: commentStatusMap['PENDING'] ?? 0,
    approvedComments: commentStatusMap['APPROVED'] ?? 0,
    spamComments: commentStatusMap['SPAM'] ?? 0,
    totalUsers,
    totalCategories,
    totalTags,
    totalFriendLinks:
      (friendLinkStatusMap['PENDING'] ?? 0) +
      (friendLinkStatusMap['APPROVED'] ?? 0) +
      (friendLinkStatusMap['REJECTED'] ?? 0) +
      (friendLinkStatusMap['HIDDEN'] ?? 0),
    pendingFriendLinks: friendLinkStatusMap['PENDING'] ?? 0,
    postsLast30Days,
    viewsLast30Days: [],
    recentPosts: recentPostsRaw.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      viewCount: p.viewCount,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

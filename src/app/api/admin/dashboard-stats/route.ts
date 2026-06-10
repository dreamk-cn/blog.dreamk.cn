import { ok } from '@/lib/api-response';
import { withAdmin } from '@/lib/route-handler';
import { getDashboardStats } from '@/services/admin-dashboard-stats';

export const GET = withAdmin(async () => {
  const stats = await getDashboardStats();
  return ok(stats, '获取统计数据成功');
}, '获取统计数据失败');

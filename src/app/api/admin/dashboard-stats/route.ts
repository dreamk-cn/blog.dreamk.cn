import { internalError, ok } from '@/lib/api-response';
import { requireAdmin } from '@/lib/route-auth';
import { getDashboardStats } from '@/services/admin-dashboard-stats';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const stats = await getDashboardStats();
    return ok(stats, '获取统计数据成功');
  } catch (err) {
    console.error('dashboard-stats error', err);
    return internalError();
  }
}

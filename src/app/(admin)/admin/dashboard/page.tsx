import { auth } from "@/auth";
import { getDashboardStats } from "@/services/admin-dashboard-stats";
import DashboardClient from "./dashboard-client";

async function getDashboardPageData() {
  const sessionPromise = auth();

  try {
    const [session, stats] = await Promise.all([sessionPromise, getDashboardStats()]);
    return {
      stats,
      error: null,
      userName: session?.user?.name ?? null,
      userImage: session?.user?.image ?? null,
    };
  } catch {
    const session = await sessionPromise;
    return {
      stats: null,
      error: "获取统计数据失败",
      userName: session?.user?.name ?? null,
      userImage: session?.user?.image ?? null,
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardPageData();
  return <DashboardClient {...data} />;
}

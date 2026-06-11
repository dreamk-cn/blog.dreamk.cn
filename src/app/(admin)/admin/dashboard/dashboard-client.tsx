"use client";

import { AppLink } from "@/components/ui/app-link";
import { useRouter } from "next/navigation";
import type { DashboardStats } from "@/services/admin-dashboard-stats";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Separator,
} from "@heroui/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "已发布",
  DRAFT: "草稿",
  ARCHIVED: "已归档",
};

function postStatusChipColor(status: string): "success" | "warning" | "default" {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED") return "warning";
  return "default";
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  href?: string;
  badge?: string;
  badgeTone?: "success" | "warning" | "danger" | "default" | "accent";
}

function StatCard({ label, value, icon, href, badge, badgeTone = "warning" }: StatCardProps) {
  const inner = (
    <Card className={`h-full shadow-sm transition-shadow ${href ? "group-hover:shadow-md" : ""}`} variant="default">
      <Card.Content className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl leading-none" aria-hidden>
            {icon}
          </span>
          {badge ? (
            <Chip size="sm" variant="soft" color={badgeTone}>
              <Chip.Label>{badge}</Chip.Label>
            </Chip>
          ) : null}
        </div>
        <div>
          <p className="text-3xl font-bold text-text-base tabular-nums">{value}</p>
          <p className="mt-0.5 text-sm text-text-muted">{label}</p>
        </div>
      </Card.Content>
    </Card>
  );

  if (href) {
    return (
      <AppLink
        href={href}
        className="group block h-full min-h-0 rounded-2xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-accent"
      >
        {inner}
      </AppLink>
    );
  }

  return inner;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Card className="border border-border px-3 py-2 shadow-lg" variant="transparent">
      <Card.Content className="p-0 text-xs">
        {label ? <p className="mb-1 font-medium text-text-base">{label}</p> : null}
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </Card.Content>
    </Card>
  );
}

type DashboardClientProps = {
  stats: DashboardStats | null;
  error?: string | null;
  userName?: string | null;
  userImage?: string | null;
};

export default function DashboardClient({ stats, error, userName, userImage }: DashboardClientProps) {
  const router = useRouter();

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-md">
          <Alert status="danger">
            <Alert.Title>加载失败</Alert.Title>
            <Alert.Description>{error ?? "数据加载失败"}</Alert.Description>
          </Alert>
          <Button className="mt-4 w-full" variant="secondary" onPress={() => router.refresh()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  const postStatusPie = [
    { name: "已发布", value: stats.publishedPosts, fill: "#22c55e" },
    { name: "草稿", value: stats.draftPosts, fill: "#f59e0b" },
    { name: "已归档", value: stats.archivedPosts, fill: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const commentStatusBar = [
    { name: "待审核", value: stats.pendingComments, fill: "#f59e0b" },
    { name: "已通过", value: stats.approvedComments, fill: "#22c55e" },
    { name: "垃圾", value: stats.spamComments, fill: "#ef4444" },
  ];

  const postsChartData = stats.postsLast30Days.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="min-h-full space-y-6 bg-canvas p-6">
      <Card className="shadow-sm" variant="default">
        <Card.Content className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar color="accent" size="lg" className="h-14 w-14 shrink-0">
            {userImage ? <Avatar.Image src={userImage} alt="" /> : null}
            <Avatar.Fallback>{userName?.slice(0, 1) ?? "管"}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Card.Title className="text-lg font-semibold text-text-base">欢迎回来，{userName ?? "管理员"}</Card.Title>
            <Card.Description className="mt-1 text-sm text-text-muted">
              {new Date().toLocaleDateString("zh-CN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Card.Description>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard label="文章总数" value={stats.totalPosts} icon="📝" href="/admin/post/list" />
        <StatCard
          label="已发布"
          value={stats.publishedPosts}
          icon="✅"
          badge={`草稿 ${stats.draftPosts}`}
          badgeTone="warning"
          href="/admin/post/list"
        />
        <StatCard label="总浏览量" value={stats.totalViews.toLocaleString()} icon="👁️" />
        <StatCard
          label="评论总数"
          value={stats.totalComments}
          icon="💬"
          badge={stats.pendingComments > 0 ? `待审 ${stats.pendingComments}` : undefined}
          badgeTone="danger"
          href="/admin/comment/list"
        />
        <StatCard label="用户数" value={stats.totalUsers} icon="👤" href="/admin/user/list" />
        <StatCard label="分类数" value={stats.totalCategories} icon="📂" href="/admin/category/list" />
        <StatCard label="标签数" value={stats.totalTags} icon="🏷️" href="/admin/tag/list" />
        <StatCard
          label="友情链接"
          value={stats.totalFriendLinks}
          icon="🔗"
          badge={stats.pendingFriendLinks > 0 ? `待审 ${stats.pendingFriendLinks}` : undefined}
          badgeTone="danger"
          href="/admin/friend-link/list"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2" variant="default">
          <Card.Header className="flex flex-col gap-1 px-5 pb-0 pt-5">
            <Card.Title className="text-base font-semibold text-text-base">最近 30 天新增文章</Card.Title>
          </Card.Header>
          <Card.Content className="px-2 pb-4 pt-2 sm:px-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={postsChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="postGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted, #94a3b8)" }}
                  interval={4}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-muted, #94a3b8)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="新增文章"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#postGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card className="shadow-sm" variant="default">
          <Card.Header className="flex flex-col gap-1 px-5 pb-0 pt-5">
            <Card.Title className="text-base font-semibold text-text-base">文章状态分布</Card.Title>
          </Card.Header>
          <Card.Content className="px-2 pb-4 pt-2 sm:px-4">
            {postStatusPie.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-text-muted">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={postStatusPie}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <Card className="border border-border px-3 py-2 shadow-lg" variant="transparent">
                          <Card.Content className="p-0 text-xs">
                            <p style={{ color: d.payload.fill }} className="font-bold">
                              {d.name}
                            </p>
                            <p className="text-text-base">数量: {d.value}</p>
                          </Card.Content>
                        </Card>
                      );
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-text-muted">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-sm" variant="default">
          <Card.Header className="flex flex-col gap-1 px-5 pb-0 pt-5">
            <Card.Title className="text-base font-semibold text-text-base">评论状态分布</Card.Title>
          </Card.Header>
          <Card.Content className="px-2 pb-4 pt-2 sm:px-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={commentStatusBar} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted, #94a3b8)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-muted, #94a3b8)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <Card className="border border-border px-3 py-2 shadow-lg" variant="transparent">
                        <Card.Content className="p-0 text-xs">
                          <p className="font-medium text-text-base">{label}</p>
                          <p style={{ color: payload[0].payload.fill }}>
                            数量: <span className="font-bold">{payload[0].value}</span>
                          </p>
                        </Card.Content>
                      </Card>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card className="shadow-sm lg:col-span-2" variant="default">
          <Card.Header className="flex flex-row items-center justify-between gap-3 px-5 pb-0 pt-5">
            <Card.Title className="text-base font-semibold text-text-base">最近文章</Card.Title>
            <Button size="sm" variant="ghost" onPress={() => router.push("/admin/post/list")}>
              查看全部
            </Button>
          </Card.Header>
          <Card.Content className="px-5 pb-5 pt-3">
            {stats.recentPosts.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">暂无文章</p>
            ) : (
              <ul className="flex flex-col">
                {stats.recentPosts.map((post, index) => (
                  <li key={post.id}>
                    {index > 0 ? <Separator className="my-1" /> : null}
                    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
                      <Chip size="sm" variant="soft" color={postStatusChipColor(post.status)}>
                        <Chip.Label>{STATUS_LABEL[post.status] ?? post.status}</Chip.Label>
                      </Chip>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-base">{post.title}</span>
                      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                        <span>浏览 {post.viewCount}</span>
                        <span>{formatFullDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

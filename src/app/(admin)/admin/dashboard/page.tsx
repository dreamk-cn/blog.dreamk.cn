'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { request } from '@/lib/request';
import type { DashboardStats } from '@/services/admin-dashboard-stats';
import { Avatar, Spinner } from '@heroui/react';
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
} from 'recharts';

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '已发布',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
};

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: '#22c55e',
  DRAFT: '#f59e0b',
  ARCHIVED: '#94a3b8',
};

// ── sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  accent?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, badge, badgeColor, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col gap-3 rounded-2xl bg-background p-5 text-left shadow-sm transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${badgeColor}22`, color: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-text-base tabular-nums">{value}</p>
        <p className="mt-0.5 text-sm text-text-muted">{label}</p>
      </div>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-base font-semibold text-text-base">{children}</h2>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-background p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-text-base">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── main page ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await request.get<DashboardStats>('/admin/dashboard-stats');
        if (res.code === 200 && res.data) {
          setStats(res.data);
        } else {
          setError(res.message || '获取数据失败');
        }
      } catch {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-foreground">
        <Spinner color="accent" size="lg" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center bg-foreground text-text-muted">
        {error ?? '数据加载失败'}
      </div>
    );
  }

  // ── derived chart data ──────────────────────────────────────────────────

  const postStatusPie = [
    { name: '已发布', value: stats.publishedPosts, fill: '#22c55e' },
    { name: '草稿', value: stats.draftPosts, fill: '#f59e0b' },
    { name: '已归档', value: stats.archivedPosts, fill: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const commentStatusBar = [
    { name: '待审核', value: stats.pendingComments, fill: '#f59e0b' },
    { name: '已通过', value: stats.approvedComments, fill: '#22c55e' },
    { name: '垃圾', value: stats.spamComments, fill: '#ef4444' },
  ];

  const postsChartData = stats.postsLast30Days.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="min-h-full space-y-6 bg-foreground p-6">

      {/* ── welcome banner ── */}
      <div className="flex items-center gap-4 rounded-2xl bg-background px-6 py-4 shadow-sm">
        {session?.user?.image && (
          <Avatar>
            <Avatar.Image src={session.user.image}></Avatar.Image>
            <Avatar.Fallback>
              {session.user.name?.slice(0, 1) ?? '?'}
            </Avatar.Fallback>
          </Avatar>
        )}
        <div>
          <p className="text-lg font-semibold text-text-base">
            欢迎回来，{session?.user?.name ?? '管理员'} 👋
          </p>
          <p className="text-sm text-text-muted">
            {new Date().toLocaleDateString('zh-CN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          label="文章总数"
          value={stats.totalPosts}
          icon="📝"
          onClick={() => router.push('/admin/post/list')}
        />
        <StatCard
          label="已发布"
          value={stats.publishedPosts}
          icon="✅"
          badge={`草稿 ${stats.draftPosts}`}
          badgeColor="#f59e0b"
          onClick={() => router.push('/admin/post/list')}
        />
        <StatCard
          label="总浏览量"
          value={stats.totalViews.toLocaleString()}
          icon="👁️"
        />
        <StatCard
          label="评论总数"
          value={stats.totalComments}
          icon="💬"
          badge={stats.pendingComments > 0 ? `待审 ${stats.pendingComments}` : undefined}
          badgeColor="#ef4444"
          onClick={() => router.push('/admin/comment/list')}
        />
        <StatCard
          label="用户数"
          value={stats.totalUsers}
          icon="👤"
          onClick={() => router.push('/admin/user/list')}
        />
        <StatCard
          label="分类数"
          value={stats.totalCategories}
          icon="📂"
          onClick={() => router.push('/admin/category/list')}
        />
        <StatCard
          label="标签数"
          value={stats.totalTags}
          icon="🏷️"
          onClick={() => router.push('/admin/tag/list')}
        />
        <StatCard
          label="友情链接"
          value={stats.totalFriendLinks}
          icon="🔗"
          badge={stats.pendingFriendLinks > 0 ? `待审 ${stats.pendingFriendLinks}` : undefined}
          badgeColor="#ef4444"
          onClick={() => router.push('/admin/friend-link/list')}
        />
      </div>

      {/* ── charts row 1 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* posts last 30 days */}
        <Panel className="lg:col-span-2">
          <SectionTitle>最近 30 天新增文章</SectionTitle>
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
                tick={{ fontSize: 11, fill: 'var(--color-text-muted, #94a3b8)' }}
                interval={4}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted, #94a3b8)' }}
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
        </Panel>

        {/* post status pie */}
        <Panel>
          <SectionTitle>文章状态分布</SectionTitle>
          {postStatusPie.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-text-muted text-sm">
              暂无数据
            </div>
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
                      <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg">
                        <p style={{ color: d.payload.fill }} className="font-bold">{d.name}</p>
                        <p className="text-text-base">数量: {d.value}</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-text-muted">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* ── charts row 2 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* comment status bar */}
        <Panel>
          <SectionTitle>评论状态分布</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={commentStatusBar} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted, #94a3b8)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted, #94a3b8)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg">
                      <p className="font-medium text-text-base">{label}</p>
                      <p style={{ color: payload[0].payload.fill }}>
                        数量: <span className="font-bold">{payload[0].value}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* recent posts */}
        <Panel className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>最近文章</SectionTitle>
            <button
              type="button"
              onClick={() => router.push('/admin/post/list')}
              className="text-xs text-accent hover:underline"
            >
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-border">
            {stats.recentPosts.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-muted">暂无文章</p>
            ) : (
              stats.recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${STATUS_COLOR[post.status]}22`,
                      color: STATUS_COLOR[post.status],
                    }}
                  >
                    {STATUS_LABEL[post.status] ?? post.status}
                  </span>
                  <span className="flex-1 truncate text-sm text-text-base">{post.title}</span>
                  <span className="shrink-0 text-xs text-text-muted">
                    👁 {post.viewCount}
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">
                    {formatFullDate(post.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

    </div>
  );
}

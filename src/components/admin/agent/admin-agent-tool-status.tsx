'use client';

import { getAdminAgentToolLabel } from '@/lib/admin-agent/tool-labels';
import { Spinner } from '@heroui/react';
import type { ToolActivity } from './use-admin-agent-chat';

type AdminAgentToolStatusProps = {
  activities: ToolActivity[];
};

export function AdminAgentToolStatus({ activities }: AdminAgentToolStatusProps) {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-default-100/50 px-3 py-2 dark:bg-default-100/10">
      {activities.map((activity) => (
        <div key={activity.tool} className="flex items-start gap-2 text-xs text-text-muted">
          {activity.status === 'running' ? (
            <Spinner color="current" size="sm" />
          ) : (
            <span className="mt-0.5 text-success">✓</span>
          )}
          <div className="min-w-0">
            <p className="text-text-base">
              {activity.status === 'running' ? '正在查询' : '已完成'}：
              {getAdminAgentToolLabel(activity.tool)}
            </p>
            {activity.summary ? (
              <p className="truncate text-text-sub">{activity.summary}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

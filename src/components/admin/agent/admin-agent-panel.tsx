'use client';

import { Button, Drawer } from '@heroui/react';
import { AdminAgentInput } from './admin-agent-input';
import { AdminAgentMessages } from './admin-agent-messages';
import { AdminAgentToolStatus } from './admin-agent-tool-status';
import {
  adminAgentCloseTrigger,
  adminAgentDialog,
  adminAgentDrawerFooter,
  adminAgentDrawerHeader,
} from './admin-agent-drawer.styles';
import type { ChatMessage, ToolActivity } from './use-admin-agent-chat';

type AdminAgentPanelProps = {
  available: boolean;
  fullscreen: boolean;
  messages: ChatMessage[];
  loading: boolean;
  toolActivities: ToolActivity[];
  error: string | null;
  onClear: () => void;
  onToggleFullscreen: () => void;
  onSend: (content: string) => void;
};

function FullscreenIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none">
      <path
        d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none">
      <path
        d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdminAgentPanel({
  available,
  fullscreen,
  messages,
  loading,
  toolActivities,
  error,
  onClear,
  onToggleFullscreen,
  onSend,
}: AdminAgentPanelProps) {
  return (
    <Drawer.Dialog className={adminAgentDialog({ fullscreen })}>
      <Drawer.Header className={adminAgentDrawerHeader()}>
        <div className="min-w-0">
          <Drawer.Heading className="text-sm font-semibold text-text-base">
            数据助手
          </Drawer.Heading>
          <p className="text-xs text-text-muted">只读分析 · 流式回复</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClear}
            isDisabled={loading || messages.length === 0}
          >
            清空
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={onToggleFullscreen}
            aria-label={fullscreen ? '退出全屏' : '全屏'}
          >
            {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </Button>
          <Drawer.CloseTrigger className={adminAgentCloseTrigger()} />
        </div>
      </Drawer.Header>

      {!available ? (
        <Drawer.Body className="px-4 py-6 text-center text-sm text-text-muted">
          未配置 <code className="text-text-base">DEEPSEEK_API_KEY</code>，助手暂不可用。
        </Drawer.Body>
      ) : (
        <>
          <Drawer.Body className="flex min-h-0 flex-1 flex-col p-0">
            <AdminAgentMessages messages={messages} loading={loading} fullscreen={fullscreen} />
            {toolActivities.length > 0 ? (
              <div className="shrink-0 px-3 pb-2">
                <AdminAgentToolStatus activities={toolActivities} />
              </div>
            ) : null}
            {error ? (
              <p className="shrink-0 px-4 pb-2 text-xs text-danger">{error}</p>
            ) : null}
          </Drawer.Body>
          <Drawer.Footer className={adminAgentDrawerFooter()}>
            <AdminAgentInput
              disabled={!available}
              loading={loading}
              onSend={onSend}
              fullscreen={fullscreen}
            />
          </Drawer.Footer>
        </>
      )}
    </Drawer.Dialog>
  );
}

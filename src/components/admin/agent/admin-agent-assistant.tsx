'use client';

import { Button, Drawer, Spinner } from '@heroui/react';
import { useCallback, useState } from 'react';
import { AdminAgentPanel } from './admin-agent-panel';
import { adminAgentDrawerBackdrop, adminAgentFab } from './admin-agent-drawer.styles';
import { useAdminAgentAvailability, useAdminAgentChat } from './use-admin-agent-chat';

function AgentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none">
      <path
        d="M12 3c-1.2 0-2.2.8-2.5 2H8a3 3 0 0 0-3 3v1H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a3 3 0 0 0 3 3h1.5c.3 1.2 1.3 2 2.5 2s2.2-.8 2.5-2H15a3 3 0 0 0 3-3v-1h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1.5c-.3-1.2-1.3-2-2.5-2Zm0 2a.8.8 0 1 1 0 1.6A.8.8 0 0 1 12 5Zm-4 4h8a1 1 0 0 1 1 1v1H7V9a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <path d="M10 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AdminAgentAssistant() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { available, checking } = useAdminAgentAvailability();
  const {
    messages,
    loading,
    toolActivities,
    error,
    sendMessage,
    clearMessages,
    abort,
  } = useAdminAgentChat();

  const fabLabel = checking
    ? '检查 AI 配置…'
    : available
      ? '打开数据助手'
      : '未配置 AI';

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        abort();
        setFullscreen(false);
      }
      setOpen(isOpen);
    },
    [abort],
  );

  return (
    <>
      <Drawer.Backdrop
        isOpen={open}
        onOpenChange={handleOpenChange}
        className={adminAgentDrawerBackdrop()}
      >
        <Drawer.Content placement="right">
          <AdminAgentPanel
            available={Boolean(available)}
            fullscreen={fullscreen}
            messages={messages}
            loading={loading}
            toolActivities={toolActivities}
            error={error}
            onClear={clearMessages}
            onToggleFullscreen={() => setFullscreen((value) => !value)}
            onSend={sendMessage}
          />
        </Drawer.Content>
      </Drawer.Backdrop>

      <div className={adminAgentFab()} title={fabLabel}>
        <Button
          variant="primary"
          isIconOnly
          className="h-12 w-12 rounded-full shadow-lg"
          onPress={() => setOpen(true)}
          isDisabled={checking || !available}
          aria-label={fabLabel}
        >
          {checking ? <Spinner color="current" size="sm" /> : <AgentIcon />}
        </Button>
      </div>
    </>
  );
}

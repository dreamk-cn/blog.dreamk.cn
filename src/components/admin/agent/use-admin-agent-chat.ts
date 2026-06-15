import type { AgentChatMessage } from '@/schemas/admin-agent';
import type { AgentStreamEvent } from '@/lib/admin-agent/types';
import { ADMIN_AGENT_API_PATH } from '@/lib/admin-agent/constants';
import { ResponseCode } from '@/config/response-code';
import { getSiteOrigin } from '@/lib/site-url';
import type { ApiResponse } from '@/types/request';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ChatMessage = AgentChatMessage & {
  id: string;
};

export type ToolActivity = {
  tool: string;
  status: 'running' | 'done';
  summary?: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseSseChunk(buffer: string): { events: AgentStreamEvent[]; rest: string } {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  const events: AgentStreamEvent[] = [];

  for (const part of parts) {
    const line = part
      .split('\n')
      .find((item) => item.startsWith('data: '));
    if (!line) continue;

    try {
      events.push(JSON.parse(line.slice(6)) as AgentStreamEvent);
    } catch {
      // ignore malformed chunks
    }
  }

  return { events, rest };
}

export function useAdminAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [toolActivities, setToolActivities] = useState<ToolActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setToolActivities([]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    setError(null);
    setToolActivities([]);

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
    };

    const assistantId = createMessageId();
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${getSiteOrigin()}${ADMIN_AGENT_API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('请求失败，请稍后重试');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let hasAssistantMessage = false;

      const upsertAssistant = (content: string) => {
        assistantContent = content;
        if (!hasAssistantMessage) {
          hasAssistantMessage = true;
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', content },
          ]);
          return;
        }
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content } : message,
          ),
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSseChunk(buffer);
        buffer = rest;

        for (const event of events) {
          if (event.event === 'delta') {
            upsertAssistant(assistantContent + event.content);
          } else if (event.event === 'tool_start') {
            setToolActivities((prev) => [
              ...prev.filter((item) => item.tool !== event.tool),
              { tool: event.tool, status: 'running' },
            ]);
          } else if (event.event === 'tool_done') {
            setToolActivities((prev) =>
              prev.map((item) =>
                item.tool === event.tool
                  ? { ...item, status: 'done', summary: event.summary }
                  : item,
              ),
            );
          } else if (event.event === 'error') {
            setError(event.message);
            if (!hasAssistantMessage) {
              upsertAssistant(`抱歉，出现了错误：${event.message}`);
            }
          } else if (event.event === 'done') {
            setToolActivities([]);
          }
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : '发送失败';
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: `抱歉，出现了错误：${message}`,
        },
      ]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setLoading(false);
      setToolActivities([]);
    }
  }, [loading, messages]);

  const clearMessages = useCallback(() => {
    abort();
    setMessages([]);
    setError(null);
  }, [abort]);

  useEffect(() => () => abort(), [abort]);

  return {
    messages,
    loading,
    toolActivities,
    error,
    sendMessage,
    clearMessages,
    abort,
  };
}

export function useAdminAgentAvailability() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch(`${getSiteOrigin()}${ADMIN_AGENT_API_PATH}`);
        const json = (await response.json()) as ApiResponse<{ available: boolean }>;
        if (!cancelled) {
          setAvailable(
            json.code === ResponseCode.SUCCESS && Boolean(json.data?.available),
          );
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { available, checking };
}

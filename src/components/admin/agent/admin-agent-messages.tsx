'use client';

import clsx from 'clsx';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from './use-admin-agent-chat';

type AdminAgentMessagesProps = {
  messages: ChatMessage[];
  loading: boolean;
  fullscreen?: boolean;
};

export function AdminAgentMessages({ messages, loading, fullscreen }: AdminAgentMessagesProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-text-base">后台数据助手</p>
        <p className="text-xs leading-6 text-text-muted">
          可以问我：待审核评论有多少、最近发布的文章、垃圾评论列表等。
        </p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-3',
        fullscreen ? 'px-6 md:px-8' : 'px-4',
      )}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={clsx(
            'rounded-2xl px-3 py-2 leading-6',
            fullscreen ? 'max-w-[85%] text-base' : 'max-w-[92%] text-sm',
            message.role === 'user'
              ? 'ml-auto bg-primary text-primary-foreground'
              : 'mr-auto border border-border bg-background text-text-base',
          )}
        >
          {message.role === 'assistant' ? (
            <div
              className={clsx(
                'prose max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-table:my-2',
                fullscreen ? 'prose-base' : 'prose-sm',
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-white">{message.content}</p>
          )}
        </div>
      ))}
      {loading ? (
        <div className="mr-auto flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-xs text-text-muted">
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
          </span>
          思考中…
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}

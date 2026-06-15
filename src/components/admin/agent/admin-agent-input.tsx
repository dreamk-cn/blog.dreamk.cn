'use client';

import { Button, TextArea } from '@heroui/react';
import clsx from 'clsx';
import type { KeyboardEvent } from 'react';
import { useCallback, useState } from 'react';

type AdminAgentInputProps = {
  disabled?: boolean;
  loading?: boolean;
  fullscreen?: boolean;
  onSend: (content: string) => void;
};

export function AdminAgentInput({
  disabled,
  loading,
  fullscreen,
  onSend,
}: AdminAgentInputProps) {
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }, [onSend, value]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={clsx('w-full py-3', fullscreen ? 'px-6 md:px-8' : 'px-4')}>
      <TextArea
        variant="secondary"
        fullWidth
        className="w-full text-text-base min-h-20"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={fullscreen ? 4 : 2}
        disabled={disabled || loading}
        placeholder={disabled ? '未配置 AI，无法发送消息' : '输入问题，Enter 发送，Shift+Enter 换行'}
      />
      <div className="mt-2 flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onPress={handleSend}
          isDisabled={disabled || loading || !value.trim()}
        >
          {loading ? '发送中…' : '发送'}
        </Button>
      </div>
    </div>
  );
}

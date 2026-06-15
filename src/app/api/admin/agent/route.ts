import { ok } from '@/lib/api-response';
import { isAdminAgentAvailable, runAdminAgent } from '@/lib/admin-agent/run-agent';
import type { AgentStreamEvent } from '@/lib/admin-agent/types';
import { parseJson, withAdmin } from '@/lib/route-handler';
import { AgentChatInput, AgentChatSchema } from '@/schemas/admin-agent';
import { NextResponse } from 'next/server';
import { z } from 'zod';

function encodeSseEvent(event: AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function sseErrorResponse(message: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(encodeSseEvent({ event: 'error', message })),
      );
      controller.close();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

export const GET = withAdmin(async () => {
  return ok({ available: isAdminAgentAvailable() }, '获取 Agent 状态成功');
}, '获取 Agent 状态失败');

export const POST = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  let parsed: AgentChatInput;
  try {
    parsed = AgentChatSchema.parse(json ?? {});
  } catch (err) {
    if (err instanceof z.ZodError) {
      return sseErrorResponse(err.issues[0]?.message || '参数错误');
    }
    throw err;
  }

  if (!isAdminAgentAvailable()) {
    return sseErrorResponse('未配置 DEEPSEEK_API_KEY');
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runAdminAgent(parsed.messages)) {
          controller.enqueue(encoder.encode(encodeSseEvent(event)));
          if (event.event === 'error' || event.event === 'done') {
            break;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Agent 执行失败';
        controller.enqueue(
          encoder.encode(encodeSseEvent({ event: 'error', message })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}, 'Admin Agent 对话失败');

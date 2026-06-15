import { env } from '@/config/env';
import { getDeepseekClient } from '@/lib/ai-client';
import type { ClientAgentMessage } from '@/lib/admin-agent/types';
import type { AgentStreamEvent } from '@/lib/admin-agent/types';
import { ADMIN_AGENT_SYSTEM_PROMPT } from '@/lib/admin-agent/system-prompt';
import { ADMIN_AGENT_TOOLS, executeTool } from '@/lib/admin-agent/tools';
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';

const MAX_TOOL_ROUNDS = 5;

function buildLlmMessages(messages: ClientAgentMessage[]): ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: ADMIN_AGENT_SYSTEM_PROMPT },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}

function parseToolArguments(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

async function* streamFinalReply(
  client: NonNullable<ReturnType<typeof getDeepseekClient>>,
  model: string,
  messages: ChatCompletionMessageParam[],
): AsyncGenerator<AgentStreamEvent> {
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield { event: 'delta', content: delta };
    }
  }

  yield { event: 'done' };
}

async function* runToolCalls(
  toolCalls: ChatCompletionMessageToolCall[],
): AsyncGenerator<AgentStreamEvent, ChatCompletionMessageParam[]> {
  const toolMessages: ChatCompletionMessageParam[] = [];

  for (const toolCall of toolCalls) {
    if (toolCall.type !== 'function') continue;

    const toolName = toolCall.function.name;
    yield { event: 'tool_start', tool: toolName };

    const args = parseToolArguments(toolCall.function.arguments);
    const result = await executeTool(toolName, args);

    yield { event: 'tool_done', tool: toolName, summary: result.summary };

    toolMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: result.content,
    });
  }

  return toolMessages;
}

export async function* runAdminAgent(messages: ClientAgentMessage[]): AsyncGenerator<AgentStreamEvent> {
  const client = getDeepseekClient();
  if (!client) {
    yield { event: 'error', message: '未配置 DEEPSEEK_API_KEY' };
    return;
  }

  const model = env.ai?.agentModel ?? 'deepseek-v4-flash';
  const llmMessages = buildLlmMessages(messages);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const isFinalRound = round === MAX_TOOL_ROUNDS - 1;

    const response = await client.chat.completions.create({
      model,
      messages: llmMessages,
      tools: ADMIN_AGENT_TOOLS,
      tool_choice: isFinalRound ? 'none' : 'auto',
      stream: false,
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      yield { event: 'error', message: '模型未返回有效回复' };
      return;
    }

    const toolCalls = assistantMessage.tool_calls ?? [];
    if (toolCalls.length > 0) {
      llmMessages.push(assistantMessage);

      const toolGen = runToolCalls(toolCalls);
      let toolResult = await toolGen.next();
      while (!toolResult.done) {
        yield toolResult.value;
        toolResult = await toolGen.next();
      }

      const toolMessages = toolResult.value ?? [];
      llmMessages.push(...toolMessages);
      continue;
    }

    if (assistantMessage.content) {
      yield { event: 'delta', content: assistantMessage.content };
      yield { event: 'done' };
      return;
    }

    yield* streamFinalReply(client, model, llmMessages);
    return;
  }

  yield { event: 'error', message: '工具调用轮次过多，请简化问题后重试' };
}

export function isAdminAgentAvailable() {
  return Boolean(env.ai?.apiKey);
}

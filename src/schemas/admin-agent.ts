import { z } from 'zod';

export const AgentChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, '消息内容不能为空').max(8000, '消息内容过长'),
});

export const AgentChatSchema = z.object({
  messages: z.array(AgentChatMessageSchema).min(1, '至少需要一条消息').max(40, '对话轮次过多'),
});

export type AgentChatInput = z.infer<typeof AgentChatSchema>;
export type AgentChatMessage = z.infer<typeof AgentChatMessageSchema>;

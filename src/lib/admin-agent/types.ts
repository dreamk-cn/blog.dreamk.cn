import type { AgentChatMessage } from '@/schemas/admin-agent';

export type AgentStreamEvent =
  | { event: 'tool_start'; tool: string }
  | { event: 'tool_done'; tool: string; summary?: string }
  | { event: 'delta'; content: string }
  | { event: 'done' }
  | { event: 'error'; message: string };

export type ClientAgentMessage = AgentChatMessage;

export type ToolExecutionResult = {
  content: string;
  summary?: string;
};

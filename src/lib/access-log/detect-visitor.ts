import type { VisitorKind } from "@/generated/prisma";

export type VisitorInfo = {
  kind: VisitorKind;
  botName?: string;
};

const BOT_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "Googlebot", pattern: /googlebot/i },
  { name: "Bingbot", pattern: /bingbot/i },
  { name: "Bytespider", pattern: /bytespider/i },
  { name: "DuckDuckBot", pattern: /duckduckbot/i },
  { name: "Slurp", pattern: /slurp/i },
  { name: "Sogou", pattern: /sogou/i },
  { name: "Baiduspider", pattern: /baiduspider/i },
  { name: "GPTBot", pattern: /gptbot/i },
  { name: "ClaudeBot", pattern: /claudebot/i },
  { name: "Applebot", pattern: /applebot/i },
  { name: "YandexBot", pattern: /yandexbot/i },
  { name: "SemrushBot", pattern: /semrushbot/i },
];

const PREVIEW_PATTERNS = [
  /facebookexternalhit/i,
  /twitterbot/i,
  /slackbot/i,
  /discordbot/i,
  /whatsapp/i,
  /linkedinbot/i,
  /telegrambot/i,
];

export function detectVisitor(userAgent: string | null): VisitorInfo {
  if (!userAgent) {
    return { kind: "UNKNOWN" };
  }

  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { kind: "CRAWLER", botName: name };
    }
  }

  for (const pattern of PREVIEW_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { kind: "PREVIEW" };
    }
  }

  return { kind: "HUMAN" };
}

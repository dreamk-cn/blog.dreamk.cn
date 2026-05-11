import OpenAI from "openai";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export function getDeepseekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: DEEPSEEK_BASE_URL,
  });
}

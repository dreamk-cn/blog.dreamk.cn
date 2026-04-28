import { internalError, ok, zodFail } from "@/libs/api-response";
import { requireAdmin } from "@/libs/route-auth";
import OpenAI from "openai";
import { NextRequest } from "next/server";
import z from "zod";

const GenerateExcerptSchema = z.object({
  content: z
    .string()
    .trim()
    .min(20, "正文内容太短，无法生成摘要")
    .max(20000, "正文内容过长，请精简后重试"),
});

const deepseekModel = process.env.DEEPSEEK_EXCERPT_MODEL ?? "deepseek-v4-flash";

function cleanExcerpt(text: string) {
  return text
    .replace(/^["'`\s]+|["'`\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const { content } = GenerateExcerptSchema.parse(json ?? {});

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return internalError("未配置 DEEPSEEK_API_KEY");
    }

    const prompt = [
      "你是中文技术博客编辑助手。",
      "请根据输入的 Markdown 文章正文，生成一条简洁、自然、可读的中文文章摘要。",
      "要求：",
      "1) 只输出摘要正文，不要标题、引号、编号、解释。",
      "2) 长度控制在 80-160 个中文字符内。",
      "3) 不要包含 Markdown 语法符号。",
      "4) 语气中性，突出文章核心价值和结论。",
    ].join("\n");

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const result = await client.chat.completions.create({
      model: deepseekModel,
      temperature: 0.4,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: content.slice(0, 12000),
        },
      ],
    });

    const rawExcerpt = result.choices?.[0]?.message?.content ?? "";
    const excerpt = cleanExcerpt(rawExcerpt);

    if (!excerpt) {
      return internalError("未生成有效摘要，请重试");
    }

    return ok({ excerpt }, "生成摘要成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("生成文章摘要失败:", err);
    return internalError();
  }
}

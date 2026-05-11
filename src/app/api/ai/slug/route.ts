import { internalError, ok, zodFail } from "@/lib/api-response";
import { getDeepseekClient } from "@/lib/ai-client";
import { requireAdmin } from "@/lib/route-auth";
import { NextRequest } from "next/server";
import z from "zod";

const GenerateSlugSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(255),
  content: z.string().trim().max(20000).optional(),
});

const deepseekModel =
  process.env.DEEPSEEK_SLUG_MODEL ??
  process.env.DEEPSEEK_EXCERPT_MODEL ??
  "deepseek-v4-flash";

function cleanSlug(text: string) {
  const line = text.split(/\r?\n/)[0] ?? "";
  return line
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 255);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const { title, content } = GenerateSlugSchema.parse(json ?? {});

    const client = getDeepseekClient();
    if (!client) {
      return internalError("未配置 DEEPSEEK_API_KEY");
    }

    const prompt = [
      "你是网站路由与 SEO 助手，需要根据博客文章信息生成 URL 路径中的一段 slug（英文小写、连字符风格）。",
      "要求：",
      "1) 只输出一行 slug 文本，不要引号、解释、Markdown、前后空白。",
      "2) 仅使用小写英文字母 a-z、数字 0-9、连字符 -；不要用下划线或空格。",
      "3) 简洁有意义，能概括主题；长度建议 12–60 个字符。",
      "4) 若标题为中文或其他语言，请改写或意译为合适的英文短语作为 slug。",
      "5) 不要以连字符开头或结尾；不要连续多个连字符。",
    ].join("\n");

    const userParts = [`文章标题：\n${title}`];
    if (content?.trim()) {
      userParts.push(
        `正文节选（供参考，可忽略与 slug 无关内容）：\n${content.trim().slice(0, 8000)}`,
      );
    }

    const result = await client.chat.completions.create({
      model: deepseekModel,
      temperature: 0.3,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: userParts.join("\n\n"),
        },
      ],
    });

    const raw = result.choices?.[0]?.message?.content ?? "";
    const slug = cleanSlug(raw);

    if (!slug) {
      return internalError("未生成有效 slug，请重试或手动填写");
    }

    return ok({ slug }, "生成 slug 成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("生成文章 slug 失败:", err);
    return internalError();
  }
}

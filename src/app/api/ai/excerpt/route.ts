import { internalError, ok, zodFail } from "@/lib/api-response";
import { requireAdmin } from "@/lib/route-auth";
import { GenerateExcerptSchema } from "@/schemas/post";
import { generatePostExcerpt } from "@/services/post-service";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = GenerateExcerptSchema.parse(json ?? {});
    const result = await generatePostExcerpt(parsed);
    if (result.error) {
      return internalError(result.error);
    }

    return ok(result.data, "生成摘要成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("生成文章摘要失败:", err);
    return internalError();
  }
}

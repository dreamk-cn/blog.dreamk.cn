import { internalError, ok, zodFail } from "@/lib/api-response";
import { requireAdmin } from "@/lib/route-auth";
import { GenerateSlugSchema } from "@/schemas/post";
import { generatePostSlug } from "@/services/post-service";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = GenerateSlugSchema.parse(json ?? {});
    const result = await generatePostSlug(parsed);
    if (result.error) {
      return internalError(result.error);
    }

    return ok(result.data, "生成 slug 成功");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    console.error("生成文章 slug 失败:", err);
    return internalError();
  }
}

import { ResponseCode } from "@/config/response-code";
import { fail, internalError, ok, zodFail } from "@/lib/api-response";
import { getApprovedCommentAnchorMeta } from "@/services/comment-service";
import { NextRequest } from "next/server";
import z from "zod";

const QuerySchema = z.object({
  slug: z.string().min(1, "slug 不能为空"),
  id: z.string().min(1, "id 不能为空"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const { slug, id } = QuerySchema.parse({
      slug: searchParams.get("slug")?.trim(),
      id: searchParams.get("id")?.trim(),
    });

    const data = await getApprovedCommentAnchorMeta(slug, id);
    if (!data) {
      return fail(ResponseCode.FAIL, "评论不存在或未通过审核");
    }
    return ok(data, "ok");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError();
  }
}

import { ResponseCode } from "@/config/response-code";
import { fail, ok } from "@/lib/api-response";
import { withRoute } from "@/lib/route-handler";
import { getApprovedCommentAnchorMeta } from "@/services/comment-service";
import z from "zod";

const QuerySchema = z.object({
  slug: z.string().min(1, "slug 不能为空"),
  id: z.string().min(1, "id 不能为空"),
});

export const GET = withRoute(async (request) => {
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
}, "获取评论锚点失败");

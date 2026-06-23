import { ok } from "@/lib/api-response";
import { consumePostViewRateLimit } from "@/lib/cache";
import { getRequestIp } from "@/lib/request-ip";
import { parseJson, withRoute } from "@/lib/route-handler";
import { PostViewSchema } from "@/schemas/post";
import { incrementPostView } from "@/services/post-service";
import { NextResponse } from "next/server";

export const POST = withRoute(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { slug } = PostViewSchema.parse(json ?? {});
  const ip = getRequestIp(request);
  const rate = await consumePostViewRateLimit(ip, slug);
  if (!rate.ok) {
    return ok(null, "ok");
  }

  await incrementPostView(slug);

  return ok(null, "ok");
}, "记录浏览量失败");

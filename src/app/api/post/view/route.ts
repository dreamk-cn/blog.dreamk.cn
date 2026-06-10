import { ok } from "@/lib/api-response";
import { parseJson, withRoute } from "@/lib/route-handler";
import { PostViewSchema } from "@/schemas/post";
import { incrementPostView } from "@/services/post-service";
import { NextResponse } from "next/server";

export const POST = withRoute(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const { slug } = PostViewSchema.parse(json ?? {});
  await incrementPostView(slug);

  return ok(null, "ok");
}, "记录浏览量失败");

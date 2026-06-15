import { fail, ok } from "@/lib/api-response";
import { ResponseCode } from "@/config/response-code";
import { parseJson, withAdmin } from "@/lib/route-handler";
import { GenerateSlugSchema } from "@/schemas/post";
import { generatePostSlug } from "@/services/post-service";
import { NextResponse } from "next/server";

export const POST = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = GenerateSlugSchema.parse(json ?? {});
  const result = await generatePostSlug(parsed);
  if (result.error) {
    return fail(ResponseCode.FAIL, result.error);
  }

  return ok(result.data, "生成 slug 成功");
}, "生成文章 slug 失败");

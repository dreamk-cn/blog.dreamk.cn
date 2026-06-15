import { fail, ok } from "@/lib/api-response";
import { ResponseCode } from "@/config/response-code";
import { parseJson, withAdmin } from "@/lib/route-handler";
import { GenerateExcerptSchema } from "@/schemas/post";
import { generatePostExcerpt } from "@/services/post-service";
import { NextResponse } from "next/server";

export const POST = withAdmin(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = GenerateExcerptSchema.parse(json ?? {});
  const result = await generatePostExcerpt(parsed);
  if (result.error) {
    return fail(ResponseCode.FAIL, result.error);
  }

  return ok(result.data, "生成摘要成功");
}, "生成文章摘要失败");

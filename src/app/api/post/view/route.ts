import { NextRequest } from "next/server";
import { internalError, ok, zodFail } from "@/lib/api-response";
import { PostViewSchema } from "@/schemas/post";
import { incrementPostView } from "@/services/post-service";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { slug } = PostViewSchema.parse(json ?? {});

    await incrementPostView(slug);

    return ok(null, "ok");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError();
  }
}

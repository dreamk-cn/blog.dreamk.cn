import { NextRequest } from "next/server";
import { prisma } from "@/libs/prisma";
import { internalError, ok, zodFail } from "@/libs/api-response";
import z from "zod";

const ViewSchema = z.object({
  slug: z.string().min(1, "slug不能为空"),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { slug } = ViewSchema.parse(json ?? {});

    await prisma.post.updateMany({
      where: {
        slug,
        status: "PUBLISHED",
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return ok(null, "ok");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return zodFail(err.issues[0]?.message || "参数错误");
    }
    return internalError();
  }
}

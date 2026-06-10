import { internalError, ok, zodFail } from "@/lib/api-response";
import { mapPrismaError } from "@/lib/prisma-errors";
import { requireAdmin } from "@/lib/route-auth";
import { ExternalMediaSchema, uploadCategoryToMediaCategory } from "@/schemas/media";
import { createMediaFile } from "@/services/media-file-service";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const json = await request.json();
    const parsed = ExternalMediaSchema.parse(json ?? {});
    const mediaCategory = uploadCategoryToMediaCategory(parsed.category);

    const mediaFile = await createMediaFile({
      source: "EXTERNAL",
      url: parsed.url,
      category: mediaCategory,
      userId: admin.session.user.id as string,
    });

    return ok(
      {
        id: mediaFile.id,
        url: mediaFile.url,
        source: "EXTERNAL",
        category: mediaFile.category,
      },
      "外链登记成功",
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodFail(error.issues[0]?.message || "参数错误");
    }
    const prismaErr = mapPrismaError(error);
    if (prismaErr) return prismaErr;
    console.error("登记外链媒体失败:", error);
    return internalError("登记外链失败");
  }
}

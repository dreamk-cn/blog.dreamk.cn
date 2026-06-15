import { ok } from "@/lib/api-response";
import { parseJson, withAdmin } from "@/lib/route-handler";
import { ExternalMediaSchema, uploadCategoryToMediaCategory } from "@/schemas/media";
import { createMediaFile } from "@/services/media-file-service";
import { NextResponse } from "next/server";

export const POST = withAdmin(async (request, admin) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = ExternalMediaSchema.parse(json ?? {});
  const mediaCategory = uploadCategoryToMediaCategory(parsed.category);

  const mediaFile = await createMediaFile({
    source: "EXTERNAL",
    url: parsed.url,
    category: mediaCategory,
    userId: admin.session.user.id,
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
}, "登记外链失败");

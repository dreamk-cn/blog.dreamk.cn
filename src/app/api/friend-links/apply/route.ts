import { consumeFriendLinkApplyRateLimit } from "@/lib/cache";
import { conflict, ok, tooManyRequests } from "@/lib/api-response";
import { getRequestIp } from "@/lib/request-ip";
import { parseJson, withRoute } from "@/lib/route-handler";
import { FriendLinkApplySchema } from "@/schemas/friend-link";
import { submitFriendLinkApplication } from "@/services/friend-link-service";
import { NextResponse } from "next/server";

export const POST = withRoute(async (request) => {
  const json = await parseJson(request);
  if (json instanceof NextResponse) return json;

  const parsed = FriendLinkApplySchema.parse(json ?? {});

  const ip = getRequestIp(request);
  const rate = await consumeFriendLinkApplyRateLimit(ip);
  if (!rate.ok) {
    return tooManyRequests(
      `友链申请过于频繁，每 ${rate.windowSec} 秒最多 ${rate.limit} 次，请稍后再试`,
      rate.retryAfterSec,
    );
  }

  const result = await submitFriendLinkApplication(parsed);
  if ("error" in result && result.error) {
    return conflict(result.error);
  }

  return ok({ id: result.data!.id }, "申请已提交，等待审核");
}, "提交友链申请失败");

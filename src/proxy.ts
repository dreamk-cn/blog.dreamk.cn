import { auth } from "@/auth";
import { buildAccessLogEntry } from "@/lib/access-log/build-entry";
import { shouldLogAccess } from "@/lib/access-log/should-log";
import { recordAccessLog } from "@/services/access-log-service";
import type { NextFetchEvent } from "next/server";
import { NextRequest, NextResponse } from "next/server";

const adminRoutes = ["/admin"];
const userRoutes = ["/account"];

function isAdminPath(pathname: string) {
  return adminRoutes.includes(pathname) || pathname.startsWith("/admin/");
}

function isUserPath(pathname: string) {
  return userRoutes.includes(pathname) || pathname.startsWith("/account/");
}

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;

  if (isAdminPath(pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${pathname}`, req.url));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/`, req.url));
    }
  } else if (isUserPath(pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${pathname}`, req.url));
    }
  }

  if (shouldLogAccess(req)) {
    event.waitUntil(
      recordAccessLog(buildAccessLogEntry(req, session?.user?.id)).catch(() => {
        // 写日志失败不影响页面渲染
      }),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

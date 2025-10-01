import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/admin"];

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;
  const needAuth = protectedRoutes.includes(pathname) || pathname.startsWith('/admin')
  // 如果需要登录，并且没有登录，则重定向到登录页面
  if (needAuth) {
    if (!session) {
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${pathname}`, req.url));
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/`, req.url));
    }
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

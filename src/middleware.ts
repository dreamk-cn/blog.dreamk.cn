import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/admin"];

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;
  const needAuth = protectedRoutes.includes(pathname) || pathname.startsWith('/admin')
  if (needAuth && !session) {
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${pathname}`, req.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

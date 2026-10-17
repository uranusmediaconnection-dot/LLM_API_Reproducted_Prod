import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

const publicAssetPattern = /\.(?:avif|css|gif|ico|jpeg|jpg|js|map|png|svg|txt|webp|woff2?)$/i;

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/v1" ||
    pathname.startsWith("/v1/")
  ) {
    return NextResponse.next();
  }

  if (
    pathname === "/" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    publicAssetPattern.test(pathname) ||
    isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
  ) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(redirectUrl);
}

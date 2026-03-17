import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  // If accessing staff.dillon.is root, redirect to /staff
  if (hostname.startsWith("staff.") && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};

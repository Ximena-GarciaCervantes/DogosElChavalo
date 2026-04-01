import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "./src/lib/auth-constants";

function decodeRoleFromToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

async function getRoleFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return decodeRoleFromToken(token);
}

export async function middleware(request: NextRequest) {
  const role = await getRoleFromRequest(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/login")) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (role === "CASHIER") {
      return NextResponse.redirect(new URL("/pos", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
  }

  if (pathname.startsWith("/pos")) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/pos/:path*"],
};

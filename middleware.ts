import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "change-this-secret-in-production";
  return new TextEncoder().encode(secret);
}

async function getRoleFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return String(payload.role);
  } catch {
    return null;
  }
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

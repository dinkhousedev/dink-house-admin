import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Get session cookie
  const sessionCookie = request.cookies.get("session");

  // Parse session if it exists
  let session = null;

  if (sessionCookie) {
    try {
      const decoded = Buffer.from(sessionCookie.value, "base64").toString();

      session = JSON.parse(decoded);
    } catch (e) {
      console.error("Failed to parse session:", e);
    }
  }

  const isAuthenticated = !!session;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/signup/success",
    "/auth/forgot-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // API routes should not be redirected
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected routes without authentication
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirect to appropriate dashboard if accessing auth pages while authenticated
  if (isAuthenticated && isPublicRoute) {
    const role = session?.role || "employee";

    if (["admin", "manager"].includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    } else {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
  }

  // Check role-based access for admin routes
  if (isAuthenticated && pathname.startsWith("/admin")) {
    const role = session?.role || "employee";

    if (!["admin", "manager"].includes(role)) {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

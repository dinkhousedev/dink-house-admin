import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Get session token cookie
  const sessionToken = request.cookies.get("session_token");
  const refreshToken = request.cookies.get("refresh_token");

  // Check if authenticated
  const isAuthenticated = !!(sessionToken?.value || refreshToken?.value);
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
    const userRole = request.cookies.get("user_role");
    const role = userRole?.value || "employee";

    if (["super_admin", "admin", "manager"].includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    } else {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
  }

  // Check role-based access for admin routes
  if (isAuthenticated && pathname.startsWith("/admin")) {
    const userRole = request.cookies.get("user_role");
    const role = userRole?.value || "employee";

    if (!["super_admin", "admin", "manager"].includes(role)) {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|_next/internal|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

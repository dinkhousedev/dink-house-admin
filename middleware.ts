import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(request: NextRequest) {
  // Get session token cookie
  const sessionToken = request.cookies.get("session_token");
  const refreshToken = request.cookies.get("refresh_token");

  // Check if authenticated
  let isAuthenticated = !!(sessionToken?.value || refreshToken?.value);
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/callback",
    "/auth/forgot-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // API routes and debug routes should not be redirected
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/dashboard/debug-")
  ) {
    return NextResponse.next();
  }

  // If authenticated with tokens, verify/refresh if needed
  if (isAuthenticated && sessionToken?.value && refreshToken?.value) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      // Try to verify the current token
      const { error: verifyError } = await supabase.auth.getUser(
        sessionToken.value,
      );

      // If token is expired, try to refresh
      if (verifyError && verifyError.message?.includes("expired")) {
        const supabaseAnon = createClient(
          supabaseUrl,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } },
        );

        const { data, error: refreshError } =
          await supabaseAnon.auth.refreshSession({
            refresh_token: refreshToken.value,
          });

        if (!refreshError && data.session) {
          // Create response with updated cookies
          const response = NextResponse.next();

          response.cookies.set("session_token", data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60, // 1 hour
            path: "/",
          });

          response.cookies.set(
            "refresh_token",
            data.session.refresh_token || "",
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: "/",
            },
          );

          isAuthenticated = true;

          // Continue with role-based checks below
          if (!isPublicRoute) {
            return response;
          }
        } else {
          // Refresh failed, redirect to login
          isAuthenticated = false;
        }
      }
    }
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

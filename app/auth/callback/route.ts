import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  try {
    // Create SSR client for proper session handling
    const supabase = await createClient();

    // Exchange the code for a session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError);

      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
    }

    if (!sessionData.session || !sessionData.user) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`);
    }

    const { session, user } = sessionData;

    // Create service client for database queries
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } },
    );

    // Check if user's email is in allowed_emails
    const { data: allowedEmail, error: allowedError } = await serviceClient
      .from("allowed_emails")
      .select("role, is_active")
      .eq("email", user.email)
      .single();

    if (allowedError || !allowedEmail || !allowedEmail.is_active) {
      console.error(
        "User not authorized:",
        allowedError || "Not in allowed_emails",
      );

      return NextResponse.redirect(`${origin}/auth/login?error=not_authorized`);
    }

    const userRole = allowedEmail.role || "viewer";

    // Set session cookies
    const cookieStore = await cookies();

    cookieStore.set("session_token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour (match JWT expiry)
      path: "/",
    });

    cookieStore.set("refresh_token", session.refresh_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    cookieStore.set("user_role", userRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour (match session token)
      path: "/",
    });

    // Redirect based on role
    if (["super_admin", "admin", "manager"].includes(userRole)) {
      return NextResponse.redirect(`${origin}/`);
    } else {
      return NextResponse.redirect(`${origin}/employee/dashboard`);
    }
  } catch (error) {
    console.error("OAuth callback error:", error);

    return NextResponse.redirect(`${origin}/auth/login?error=unexpected_error`);
  }
}

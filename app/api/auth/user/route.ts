import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");
    const refreshToken = cookieStore.get("refresh_token");

    // If no session token, return unauthorized immediately
    if (!sessionToken?.value) {
      return NextResponse.json(
        { error: "Unauthorized - No session token", success: false },
        { status: 401 },
      );
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase configuration missing");

      return NextResponse.json(
        { error: "Authentication service not configured", success: false },
        { status: 500 },
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify the session with Supabase Auth
    let {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(sessionToken.value);

    // If token is expired and we have a refresh token, try to refresh
    if (
      authError &&
      authError.message?.includes("expired") &&
      refreshToken?.value
    ) {
      console.log("Token expired, attempting refresh...");

      const supabaseAnon = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } },
      );

      const { data: refreshData, error: refreshError } =
        await supabaseAnon.auth.refreshSession({
          refresh_token: refreshToken.value,
        });

      if (!refreshError && refreshData.session) {
        // Update cookies with new tokens
        cookieStore.set("session_token", refreshData.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour (match JWT expiry)
          path: "/",
        });

        cookieStore.set(
          "refresh_token",
          refreshData.session.refresh_token || "",
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
          },
        );

        // Retry verification with new token
        const retryResult = await supabaseAdmin.auth.getUser(
          refreshData.session.access_token,
        );

        authUser = retryResult.data.user;
        authError = retryResult.error;

        console.log("Token refreshed successfully");
      } else {
        console.error("Failed to refresh token:", refreshError);
      }
    }

    if (authError || !authUser) {
      console.error("Error verifying session:", authError);

      return NextResponse.json(
        { error: "Invalid session", success: false },
        { status: 401 },
      );
    }

    console.log("Auth user data:", { id: authUser.id, email: authUser.email });

    if (!authUser.email) {
      console.error("Auth user has no email");

      return NextResponse.json(
        { error: "User email not found", success: false },
        { status: 400 },
      );
    }

    // Get user role from allowed_emails table
    console.log("Looking up user email:", authUser.email);
    
    const { data: allowedEmail, error: profileError } = await supabaseAdmin
      .from("allowed_emails")
      .select("email, first_name, last_name, role, is_active")
      .eq("email", authUser.email)
      .maybeSingle();

    console.log("Query result:", { allowedEmail, profileError });

    if (profileError) {
      console.error("Database error getting user profile:", profileError);

      return NextResponse.json(
        { error: "Database error", success: false, details: profileError.message },
        { status: 500 },
      );
    }

    if (!allowedEmail) {
      console.error("User not found in allowed_emails:", authUser.email);

      return NextResponse.json(
        { error: "User not authorized", success: false },
        { status: 403 },
      );
    }

    if (!allowedEmail.is_active) {
      console.error("User account is not active:", authUser.email);

      return NextResponse.json(
        { error: "User account is not active", success: false },
        { status: 403 },
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        first_name: allowedEmail.first_name,
        last_name: allowedEmail.last_name,
        role: allowedEmail.role,
        user_type: "admin",
      },
    });
  } catch (error) {
    console.error("User API error:", error);

    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 },
    );
  }
}

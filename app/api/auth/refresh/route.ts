import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token");

    if (!refreshToken?.value) {
      return NextResponse.json(
        { error: "No refresh token found", success: false },
        { status: 401 },
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase configuration missing");

      return NextResponse.json(
        { error: "Authentication service not configured", success: false },
        { status: 500 },
      );
    }

    // Create Supabase client with anon key (not service role)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Refresh the session using the refresh token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken.value,
    });

    if (error || !data.session) {
      console.error("Error refreshing session:", error);

      return NextResponse.json(
        { error: "Failed to refresh session", success: false },
        { status: 401 },
      );
    }

    const { session } = data;

    // Update cookies with new tokens
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

    return NextResponse.json({
      success: true,
      message: "Session refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh API error:", error);

    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 },
    );
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    // If no session token, return unauthorized immediately
    if (!sessionToken?.value) {
      return NextResponse.json(
        { error: "Unauthorized - No session token", success: false },
        { status: 401 }
      );
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase configuration missing");
      return NextResponse.json(
        { error: "Authentication service not configured", success: false },
        { status: 500 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Get user info by session token (function is in api schema)
    const { data: userData, error: userError } = await supabaseAdmin
      .schema("api")
      .rpc("get_user_by_session", {
        session_token: sessionToken.value,
      });

    if (userError) {
      console.error("Error getting user by session:", userError);
      return NextResponse.json(
        { error: "Failed to get user info", success: false, details: userError.message },
        { status: 500 }
      );
    }

    if (userData?.success && userData?.user) {
      return NextResponse.json({
        success: true,
        user: userData.user,
      });
    }

    // If no user data found
    return NextResponse.json(
      { error: "User not found", success: false },
      { status: 404 }
    );
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
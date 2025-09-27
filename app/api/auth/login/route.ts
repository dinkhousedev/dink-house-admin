import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      console.error("Supabase service client is not configured");

      return NextResponse.json(
        { error: "Authentication service is unavailable" },
        { status: 500 },
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.schema("api").rpc("login", {
      email,
      password,
    });

    if (error) {
      console.error("Login RPC error:", error);

      return NextResponse.json(
        { error: error.message ?? "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error ?? "Invalid credentials" },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();

    cookieStore.set("session_token", data.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    cookieStore.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Store user info for middleware access
    const userRole = data.user?.profile?.role || data.user?.role || "employee";

    cookieStore.set("user_role", userRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: data.user,
      expires_at: data.expires_at,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}

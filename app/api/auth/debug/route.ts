import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");
  const refreshToken = cookieStore.get("refresh_token");
  const userRole = cookieStore.get("user_role");

  return NextResponse.json({
    cookies: {
      session_token: sessionToken?.value ? "Present" : "Not found",
      session_token_length: sessionToken?.value?.length || 0,
      refresh_token: refreshToken?.value ? "Present" : "Not found",
      user_role: userRole?.value || "Not found",
    },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "Configured"
        : "Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "Configured"
        : "Missing",
    },
  });
}

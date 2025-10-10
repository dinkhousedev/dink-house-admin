import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple test endpoint to verify cookies and basic functionality
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    return NextResponse.json({
      success: true,
      hasSessionToken: !!sessionToken?.value,
      tokenLength: sessionToken?.value?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test endpoint error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

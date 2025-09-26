import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // For development, accept any password for authorized emails
    // In production, you'd verify against stored hash

    // Check if email is in allowed_emails
    const checkResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/check-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    const checkData = await checkResponse.json();

    if (!checkData.allowed) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create session
    const sessionToken = Buffer.from(
      JSON.stringify({
        email,
        role: checkData.role || "admin",
        firstName: checkData.firstName || email.split("@")[0].split(".")[0],
        lastName: checkData.lastName || email.split("@")[0].split(".")[1] || "",
        timestamp: Date.now(),
      }),
    ).toString("base64");

    const userData = {
      id: crypto.randomUUID(),
      email,
      first_name: checkData.firstName || "Tim",
      last_name: checkData.lastName || "Carrender",
      role: checkData.role || "admin",
      status: "active",
    };

    // Set session cookie
    const cookieStore = await cookies();

    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: userData,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}

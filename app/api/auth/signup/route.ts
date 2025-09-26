import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // For development, we'll use a simple session approach
    // In production, you'd use proper auth service

    // Create a simple session token
    const sessionToken = Buffer.from(
      JSON.stringify({
        email,
        role,
        firstName,
        lastName,
        timestamp: Date.now(),
      }),
    ).toString("base64");

    // Store user data (in production, this would go to database)
    const userData = {
      id: crypto.randomUUID(),
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      status: "active",
      created_at: new Date().toISOString(),
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

    // Store user in localStorage for client-side access
    const response = NextResponse.json({
      success: true,
      user: userData,
      message: "Account created successfully",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}

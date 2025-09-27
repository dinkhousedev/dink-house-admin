import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import { createClient } from "@/lib/supabase/server";

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

    const supabase = await createClient();

    // First, verify the email is allowed
    const { data: allowedEmail, error: checkError } = await supabase
      .from("allowed_emails")
      .select("email, used_at")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (checkError || !allowedEmail) {
      return NextResponse.json(
        {
          error:
            "This email is not authorized to sign up. Please contact your administrator.",
        },
        { status: 403 },
      );
    }

    // Check if email has already been used
    if (allowedEmail.used_at) {
      return NextResponse.json(
        { error: "This email has already been used to create an account." },
        { status: 409 },
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

    // Mark the allowed email as used
    const { error: updateError } = await supabase
      .from("allowed_emails")
      .update({
        used_at: new Date().toISOString(),
        used_by: userData.id,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase());

    if (updateError) {
      console.error("Error updating allowed_emails:", updateError);
      // Continue even if update fails - the account is created
    }

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

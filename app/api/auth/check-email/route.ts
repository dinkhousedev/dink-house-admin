import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Query the allowed_emails table in the app_auth schema
    const { data, error } = await supabase
      .from("allowed_emails")
      .select("email, first_name, last_name, role, used_at")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error checking allowed emails:", error);

      // Check if it's a "not found" error
      if (error.code === "PGRST116") {
        return NextResponse.json({
          allowed: false,
          message:
            "This email is not authorized to sign up. Please contact your administrator.",
        });
      }

      // For development, temporarily allow all emails on error
      if (process.env.NODE_ENV === "development") {
        console.log("Development mode (error fallback): allowing email");

        return NextResponse.json({
          allowed: true,
          firstName: email.split("@")[0].split(".")[0],
          lastName: email.split("@")[0].split(".")[1] || "",
          role: "admin",
        });
      }

      return NextResponse.json({ allowed: false });
    }

    // Check if email has already been used
    if (data.used_at) {
      return NextResponse.json({
        allowed: false,
        message: "This email has already been used to create an account.",
      });
    }

    // Email is allowed and hasn't been used yet
    return NextResponse.json({
      allowed: true,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      role: data.role || "coach",
    });
  } catch (error) {
    console.error("Error checking email:", error);

    // For development, temporarily allow all emails on error
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode (error fallback): allowing email");

      return NextResponse.json({
        allowed: true,
        firstName: null,
        lastName: null,
        role: "admin",
      });
    }

    return NextResponse.json(
      { error: "Failed to check email authorization" },
      { status: 500 },
    );
  }
}

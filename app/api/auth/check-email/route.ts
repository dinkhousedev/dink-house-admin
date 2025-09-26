import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Try to query the allowed_emails table via REST API
    const tableResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(email.toLowerCase())}&is_active=eq.true`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Response status:", tableResponse.status);

    if (!tableResponse.ok) {
      const errorText = await tableResponse.text();

      console.error("Failed to check allowed emails:", errorText);

      // For development, temporarily allow all emails
      if (process.env.NODE_ENV === "development") {
        console.log("Development mode: allowing email", email);

        return NextResponse.json({
          allowed: true,
          firstName: email.split("@")[0].split(".")[0],
          lastName: email.split("@")[0].split(".")[1] || "",
          role: "admin",
        });
      }

      return NextResponse.json({ allowed: false });
    }

    const data = await tableResponse.json();

    console.log("Allowed emails data:", data);

    if (data && data.length > 0) {
      const allowedEmail = data[0];

      return NextResponse.json({
        allowed: true,
        firstName: allowedEmail.first_name || null,
        lastName: allowedEmail.last_name || null,
        role: allowedEmail.role || "coach",
      });
    }

    return NextResponse.json({ allowed: false });
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

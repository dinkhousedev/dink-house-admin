import { NextRequest, NextResponse } from "next/server";

// Simple API endpoint for adding allowed emails via curl
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Direct database connection for simplicity
    const dbUrl =
      process.env.DATABASE_URL ||
      "postgresql://postgres:DevPassword123!@localhost:9432/dink_house";

    // Use fetch to call the Supabase REST API directly
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          email: body.email.toLowerCase(),
          first_name: body.first_name || body.firstName || null,
          last_name: body.last_name || body.lastName || null,
          role: body.role || "admin",
          notes:
            body.notes || `Added via API on ${new Date().toLocaleString()}`,
          is_active: true,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();

      console.error("Supabase error:", error);

      // Check if it's a duplicate email error
      if (error.includes("duplicate") || error.includes("unique")) {
        return NextResponse.json(
          {
            success: false,
            error: "This email is already in the allowed list",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to add email to allowed list",
        },
        { status: 500 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: `Email ${body.email} has been added to the allowed list`,
      data: {
        id: data[0]?.id,
        email: data[0]?.email,
        role: data[0]?.role,
        first_name: data[0]?.first_name,
        last_name: data[0]?.last_name,
      },
    });
  } catch (error) {
    console.error("Error adding allowed email:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add allowed email",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check if an email is allowed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      // Return all allowed emails if no specific email requested
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails?is_active=eq.true&order=email`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        return NextResponse.json({
          success: true,
          count: data.length,
          emails: data.map((item: any) => ({
            email: item.email,
            role: item.role,
            name:
              `${item.first_name || ""} ${item.last_name || ""}`.trim() || null,
            is_used: item.used_at !== null,
          })),
        });
      }
    }

    // Check specific email
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${email.toLowerCase()}&is_active=eq.true`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      },
    );

    if (response.ok) {
      const data = await response.json();

      if (data.length > 0) {
        return NextResponse.json({
          success: true,
          allowed: true,
          email: data[0].email,
          role: data[0].role,
          is_used: data[0].used_at !== null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      allowed: false,
      email: email,
    });
  } catch (error) {
    console.error("Error checking allowed email:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check allowed email",
      },
      { status: 500 },
    );
  }
}

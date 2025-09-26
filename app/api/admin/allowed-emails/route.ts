import { NextRequest, NextResponse } from "next/server";

// GET all allowed emails
export async function GET() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails?order=created_at.desc`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          Prefer: "return=representation",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch allowed emails");
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching allowed emails:", error);

    return NextResponse.json(
      { error: "Failed to fetch allowed emails" },
      { status: 500 },
    );
  }
}

// POST new allowed email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          email: body.email.toLowerCase(),
          first_name: body.first_name || null,
          last_name: body.last_name || null,
          role: body.role || "viewer",
          notes: body.notes || null,
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
          { error: "This email is already in the allowed list" },
          { status: 400 },
        );
      }

      throw new Error("Failed to add allowed email");
    }

    const data = await response.json();

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error adding allowed email:", error);

    return NextResponse.json(
      { error: "Failed to add allowed email" },
      { status: 500 },
    );
  }
}

// PATCH update allowed email
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Email ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          ...body,
          updated_at: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update allowed email");
    }

    const data = await response.json();

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error updating allowed email:", error);

    return NextResponse.json(
      { error: "Failed to update allowed email" },
      { status: 500 },
    );
  }
}

// DELETE allowed email
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Email ID is required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_emails?id=eq.${id}`,
      {
        method: "DELETE",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete allowed email");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting allowed email:", error);

    return NextResponse.json(
      { error: "Failed to delete allowed email" },
      { status: 500 },
    );
  }
}

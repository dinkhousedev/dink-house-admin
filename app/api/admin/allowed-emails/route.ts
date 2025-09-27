import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

// GET - List all allowed emails
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 },
      );
    }

    // Decode session to check role
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString(),
    );

    if (sessionData.role !== "admin" && sessionData.role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden - Admin or Manager access required" },
        { status: 403 },
      );
    }

    const supabase = await createClient();

    // Get all allowed emails
    const { data, error } = await supabase
      .from("allowed_emails")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching allowed emails:", error);

      return NextResponse.json(
        { error: "Failed to fetch allowed emails" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/allowed-emails:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Add new allowed email
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 },
      );
    }

    // Decode session to check role
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString(),
    );

    if (sessionData.role !== "admin" && sessionData.role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden - Admin or Manager access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, role, notes } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate role if provided
    const validRoles = ["admin", "manager", "coach", "viewer"];

    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingEmail, error: checkError } = await supabase
      .from("allowed_emails")
      .select("email, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (existingEmail && !checkError) {
      if (existingEmail.is_active) {
        return NextResponse.json(
          { error: "This email is already in the allowed list" },
          { status: 409 },
        );
      } else {
        // Reactivate the email if it was deactivated
        const { data: updatedEmail, error: updateError } = await supabase
          .from("allowed_emails")
          .update({
            is_active: true,
            first_name: firstName || null,
            last_name: lastName || null,
            role: role || "viewer",
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("email", email.toLowerCase())
          .select()
          .single();

        if (updateError) {
          console.error("Error reactivating email:", updateError);

          return NextResponse.json(
            { error: "Failed to reactivate email" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Email reactivated successfully",
          data: updatedEmail,
        });
      }
    }

    // Add new allowed email
    const { data: newEmail, error: insertError } = await supabase
      .from("allowed_emails")
      .insert({
        email: email.toLowerCase(),
        first_name: firstName || null,
        last_name: lastName || null,
        role: role || "viewer",
        notes: notes || null,
        added_by: sessionData.email, // Store who added this email
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding allowed email:", insertError);

      return NextResponse.json(
        { error: "Failed to add email to allowed list" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email added to allowed list successfully",
      data: newEmail,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/allowed-emails:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Remove or deactivate allowed email
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 },
      );
    }

    // Decode session to check role
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString(),
    );

    if (sessionData.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if email has been used
    const { data: emailData, error: checkError } = await supabase
      .from("allowed_emails")
      .select("used_at")
      .eq("email", email.toLowerCase())
      .single();

    if (checkError || !emailData) {
      return NextResponse.json(
        { error: "Email not found in allowed list" },
        { status: 404 },
      );
    }

    if (emailData.used_at) {
      // If email has been used, only deactivate it
      const { error: updateError } = await supabase
        .from("allowed_emails")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email.toLowerCase());

      if (updateError) {
        console.error("Error deactivating email:", updateError);

        return NextResponse.json(
          { error: "Failed to deactivate email" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Email deactivated (already used for signup)",
      });
    } else {
      // If email hasn't been used, we can delete it
      const { error: deleteError } = await supabase
        .from("allowed_emails")
        .delete()
        .eq("email", email.toLowerCase());

      if (deleteError) {
        console.error("Error deleting email:", deleteError);

        return NextResponse.json(
          { error: "Failed to delete email" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Email removed from allowed list",
      });
    }
  } catch (error) {
    console.error("Error in DELETE /api/admin/allowed-emails:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

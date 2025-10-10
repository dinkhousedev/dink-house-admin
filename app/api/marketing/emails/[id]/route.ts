import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketing/emails/[id] - Get single email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("marketing_emails")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching email:", error);

      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("API GET /marketing/emails/[id] error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/marketing/emails/[id] - Update email
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subject, html_content, text_content, status } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updates: Record<string, any> = {};

    if (subject !== undefined) updates.subject = subject;
    if (html_content !== undefined) updates.html_content = html_content;
    if (text_content !== undefined) updates.text_content = text_content;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from("marketing_emails")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating email:", error);

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Email updated successfully",
    });
  } catch (error) {
    console.error("API PATCH /marketing/emails/[id] error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/marketing/emails/[id] - Delete email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only allow deleting drafts or failed emails
    const { data: email, error: fetchError } = await supabase
      .from("marketing_emails")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (!["draft", "failed"].includes(email.status)) {
      return NextResponse.json(
        { error: "Can only delete draft or failed emails" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("marketing_emails")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting email:", error);

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Email deleted successfully",
    });
  } catch (error) {
    console.error("API DELETE /marketing/emails/[id] error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

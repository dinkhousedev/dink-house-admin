import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/marketing/emails/[id]/send - Send email to all subscribers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { modifications } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify email exists and is in sendable state
    const { data: email, error: fetchError } = await supabase
      .from("marketing_emails")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (!["draft", "reviewed", "failed"].includes(email.status)) {
      return NextResponse.json(
        { error: "Email has already been sent or is currently sending" },
        { status: 400 }
      );
    }

    // Get subscriber count
    const { count: subscriberCount } = await supabase
      .schema("launch")
      .from("launch_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .not("verified_at", "is", null);

    if (!subscriberCount || subscriberCount === 0) {
      return NextResponse.json(
        { error: "No active subscribers found" },
        { status: 400 }
      );
    }

    // Call Supabase Edge Function to send
    const functionUrl = `${supabaseUrl}/functions/v1/generate-marketing-email/send`;

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        emailId: id,
        modifications,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to send email" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.stats,
      message: data.message,
    });
  } catch (error) {
    console.error("API POST /marketing/emails/[id]/send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

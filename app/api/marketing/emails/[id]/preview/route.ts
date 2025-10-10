import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketing/emails/[id]/preview - Get email preview with sample personalization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: email, error } = await supabase
      .from("marketing_emails")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Replace placeholders with sample data for preview
    const sampleData = {
      first_name: "Alex",
      last_name: "Johnson",
      full_name: "Alex Johnson",
      email: "alex@example.com",
    };

    let htmlPreview = email.html_content;
    let textPreview = email.text_content;

    Object.entries(sampleData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;

      htmlPreview = htmlPreview.replace(new RegExp(placeholder, "g"), value);
      if (textPreview) {
        textPreview = textPreview.replace(new RegExp(placeholder, "g"), value);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: email.id,
        subject: email.subject,
        htmlContent: htmlPreview,
        textContent: textPreview,
        status: email.status,
        created_at: email.created_at,
      },
    });
  } catch (error) {
    console.error("API GET /marketing/emails/[id]/preview error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

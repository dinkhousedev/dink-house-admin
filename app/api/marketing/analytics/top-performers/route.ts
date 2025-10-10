import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketing/analytics/top-performers - Top performing emails by engagement
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "5");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get top performers from view
    const { data, error } = await supabase
      .from("top_performing_emails")
      .select("*")
      .limit(limit);

    if (error) {
      console.error("Error fetching top performers:", error);

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("API GET /marketing/analytics/top-performers error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

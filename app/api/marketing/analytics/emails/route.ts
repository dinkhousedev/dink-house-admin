import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketing/analytics/emails - Email analytics with engagement metrics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get email analytics from view
    const { data, error } = await supabase
      .from("email_analytics")
      .select("*")
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching email analytics:", error);

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate aggregate stats
    const stats = data.reduce(
      (acc, email) => {
        acc.totalSent += email.sent_count || 0;
        acc.totalDelivered += email.delivered_count || 0;
        acc.totalOpened += email.unique_opens || 0;
        acc.totalClicked += email.unique_clicks || 0;
        acc.totalBounced += email.bounced_count || 0;
        acc.totalFailed += email.failed_count || 0;

        return acc;
      },
      {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalFailed: 0,
      },
    );

    // Calculate overall rates
    const deliveryRate =
      stats.totalSent > 0
        ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(2)
        : "0.00";

    const openRate =
      stats.totalDelivered > 0
        ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(2)
        : "0.00";

    const clickRate =
      stats.totalDelivered > 0
        ? ((stats.totalClicked / stats.totalDelivered) * 100).toFixed(2)
        : "0.00";

    const bounceRate =
      stats.totalSent > 0
        ? ((stats.totalBounced / stats.totalSent) * 100).toFixed(2)
        : "0.00";

    return NextResponse.json({
      success: true,
      data: {
        emails: data,
        aggregateStats: {
          ...stats,
          deliveryRate: parseFloat(deliveryRate),
          openRate: parseFloat(openRate),
          clickRate: parseFloat(clickRate),
          bounceRate: parseFloat(bounceRate),
        },
      },
    });
  } catch (error) {
    console.error("API GET /marketing/analytics/emails error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

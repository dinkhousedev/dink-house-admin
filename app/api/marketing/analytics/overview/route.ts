import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketing/analytics/overview - Campaign overview stats
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get overall stats from campaign_overview view
    const { data: overviewData, error: overviewError } = await supabase
      .from("campaign_overview")
      .select("*")
      .order("sent_date", { ascending: false })
      .limit(30); // Last 30 days

    if (overviewError) {
      console.error("Error fetching overview:", overviewError);

      return NextResponse.json(
        { error: overviewError.message },
        { status: 400 },
      );
    }

    // Calculate totals
    const totals = overviewData.reduce(
      (acc, row) => {
        acc.totalEmails += row.emails_sent || 0;
        acc.totalRecipients += row.total_recipients || 0;
        acc.totalOpens += row.total_opens || 0;
        acc.totalClicks += row.total_clicks || 0;

        return acc;
      },
      {
        totalEmails: 0,
        totalRecipients: 0,
        totalOpens: 0,
        totalClicks: 0,
      },
    );

    // Calculate average rates
    const avgOpenRate =
      totals.totalRecipients > 0
        ? ((totals.totalOpens / totals.totalRecipients) * 100).toFixed(2)
        : "0.00";

    const avgClickRate =
      totals.totalRecipients > 0
        ? ((totals.totalClicks / totals.totalRecipients) * 100).toFixed(2)
        : "0.00";

    // Get total subscriber count
    const { count: subscriberCount } = await supabase
      .schema("launch")
      .from("launch_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .not("verified_at", "is", null);

    return NextResponse.json({
      success: true,
      data: {
        totalCampaigns: totals.totalEmails,
        totalRecipients: totals.totalRecipients,
        totalOpens: totals.totalOpens,
        totalClicks: totals.totalClicks,
        avgOpenRate: parseFloat(avgOpenRate),
        avgClickRate: parseFloat(avgClickRate),
        activeSubscribers: subscriberCount || 0,
        chartData: overviewData,
      },
    });
  } catch (error) {
    console.error("API GET /marketing/analytics/overview error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

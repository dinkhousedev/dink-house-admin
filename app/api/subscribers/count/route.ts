import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Use direct REST API calls instead of Supabase client
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    };

    // Get total active subscribers
    const activeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/launch_subscribers?status=eq.active&select=id`,
      { headers: { ...headers, Prefer: "count=exact" } }
    );
    const activeCount = parseInt(
      activeResponse.headers.get("content-range")?.split("/")[1] || "0"
    );

    // Get total inactive subscribers
    const inactiveResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/launch_subscribers?status=neq.active&select=id`,
      { headers: { ...headers, Prefer: "count=exact" } }
    );
    const inactiveCount = parseInt(
      inactiveResponse.headers.get("content-range")?.split("/")[1] || "0"
    );

    // Get new subscribers from last week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const thisWeekResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/launch_subscribers?created_at=gte.${lastWeek.toISOString()}&select=id`,
      { headers: { ...headers, Prefer: "count=exact" } }
    );
    const newThisWeek = parseInt(
      thisWeekResponse.headers.get("content-range")?.split("/")[1] || "0"
    );

    // Get new subscribers from previous week
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const lastWeekResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/launch_subscribers?created_at=gte.${twoWeeksAgo.toISOString()}&created_at=lt.${lastWeek.toISOString()}&select=id`,
      { headers: { ...headers, Prefer: "count=exact" } }
    );
    const newLastWeek = parseInt(
      lastWeekResponse.headers.get("content-range")?.split("/")[1] || "0"
    );

    // Calculate week-over-week growth
    const growthRate =
      newLastWeek > 0
        ? (((newThisWeek - newLastWeek) / newLastWeek) * 100).toFixed(1)
        : newThisWeek > 0
          ? "100"
          : "0";

    return NextResponse.json({
      success: true,
      data: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount,
        newThisWeek,
        newLastWeek,
        growthRate: `${parseFloat(growthRate) > 0 ? "+" : ""}${growthRate}%`,
      },
    });
  } catch (error: any) {
    console.error("Subscriber count API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

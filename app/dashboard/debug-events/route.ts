import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  try {
    // Check all courts
    const { data: courts, error: courtsError } = await supabase
      .schema("events")
      .from("courts")
      .select("*")
      .order("court_number");

    // Check all events
    const { data: events, error: eventsError } = await supabase
      .schema("events")
      .from("events")
      .select(
        `
        id,
        title,
        event_type,
        start_time,
        end_time,
        is_cancelled
      `,
      )
      .eq("is_cancelled", false)
      .order("start_time")
      .limit(10);

    // Check open play instances
    const startOfMonth = new Date();

    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();

    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startDateStr = startOfMonth.toISOString().split("T")[0];
    const endDateStr = endOfMonth.toISOString().split("T")[0];

    const { data: openPlayInstances, error: openPlayError } = await supabase
      .schema("events")
      .from("open_play_instances")
      .select("*")
      .gte("instance_date", startDateStr)
      .lte("instance_date", endDateStr)
      .limit(10);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      courts: {
        count: courts?.length || 0,
        error: courtsError?.message,
        data: courts?.slice(0, 5),
        statusBreakdown: courts?.reduce(
          (acc, court) => {
            const status = court.status || "null";

            acc[status] = (acc[status] || 0) + 1;

            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      events: {
        count: events?.length || 0,
        error: eventsError?.message,
        data: events,
      },
      openPlayInstances: {
        count: openPlayInstances?.length || 0,
        error: openPlayError?.message,
        data: openPlayInstances,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch events happening today or in the next 7 days
    const today = new Date();
    const nextWeek = new Date();

    nextWeek.setDate(today.getDate() + 7);

    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        event_type,
        start_time,
        end_time,
        max_capacity,
        current_registrations
      `,
      )
      .eq("is_published", true)
      .eq("is_cancelled", false)
      .gte("start_time", today.toISOString())
      .lte("start_time", nextWeek.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching upcoming events:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, events: events || [] });
  } catch (error) {
    console.error("Upcoming events API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

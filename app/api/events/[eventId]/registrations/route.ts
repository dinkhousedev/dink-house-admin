import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();

    // Call the database function to get event check-in status
    const { data, error } = await supabase.rpc("get_event_checkin_status", {
      p_event_id: eventId,
    });

    if (error) {
      console.error("Registrations fetch error:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Registrations API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

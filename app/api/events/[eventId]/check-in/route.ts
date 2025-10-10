import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "Player ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Call the database function to check in the player
    const { data, error } = await supabase.rpc("check_in_player", {
      p_event_id: eventId,
      p_player_id: playerId,
    });

    if (error) {
      console.error("Check-in error:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Check-in API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

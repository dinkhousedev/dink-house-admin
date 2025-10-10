import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const playerId = (await params).id;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "Player ID is required" },
        { status: 400 },
      );
    }

    // Call the admin delete function
    const { data, error } = await supabase.rpc("admin_delete_player", {
      p_player_id: playerId,
    });

    if (error) {
      console.error("Error deleting player:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Check if the deletion was successful
    if (data && !data.success) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to delete player" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Player deleted successfully",
      data: data,
    });
  } catch (error) {
    console.error("Exception in DELETE /api/admin/members/[id]:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

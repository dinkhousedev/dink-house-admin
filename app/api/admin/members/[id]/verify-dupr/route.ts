import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();
    const { verified, verified_by, notes } = body;

    if (!verified_by) {
      return NextResponse.json(
        { success: false, error: "verified_by is required" },
        { status: 400 },
      );
    }

    if (typeof verified !== "boolean") {
      return NextResponse.json(
        { success: false, error: "verified must be a boolean" },
        { status: 400 },
      );
    }

    const { id } = await params;

    // Call the verify_dupr function
    const { data, error } = await supabase.rpc("verify_dupr", {
      p_player_id: id,
      p_verified: verified,
      p_verified_by: verified_by,
      p_notes: notes || null,
    });

    if (error) {
      console.error("Error verifying DUPR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Exception in POST /api/admin/members/[id]/verify-dupr:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

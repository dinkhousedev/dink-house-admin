import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Fetch player profile
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select(
        `
        id,
        first_name,
        last_name,
        display_name,
        phone,
        dupr_rating,
        skill_level,
        membership_level,
        user_accounts!inner(email)
      `,
      )
      .eq("account_id", user.id)
      .single();

    if (playerError) {
      console.error("Error fetching player:", playerError);

      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 },
      );
    }

    // Format the response
    const userAccount = Array.isArray(player.user_accounts)
      ? player.user_accounts[0]
      : player.user_accounts;

    const playerData = {
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      display_name: player.display_name,
      phone: player.phone,
      dupr_rating: player.dupr_rating,
      skill_level: player.skill_level,
      membership_level: player.membership_level,
      email: userAccount?.email,
    };

    return NextResponse.json({ success: true, player: playerData });
  } catch (error) {
    console.error("Player API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
